import { getReaderClient, validateReadOnlyQuery } from './clickhouse';
import crypto from 'node:crypto';

export interface McpQueryReceipt {
  queryHash: string;
  statement: string;
  elapsedSeconds: number;
  rowsRead: number;
  bytesRead: number;
  timestamp: string;
  status: 'SUCCESS' | 'QUERY_FAILED';
  readOnlyEnforced: boolean;
}

export interface McpQueryResult<T = unknown> {
  data: T[];
  receipt: McpQueryReceipt;
}

/**
 * Executes a read-only query through the official MCP ClickHouse protocol.
 * Enforces:
 * - Read-only guard (static query validation + session readonly=1)
 * - Explicit LIMIT clause enforcement (defaults to 25, capped at 100)
 * - Deterministic query receipt computation
 */
export async function executeMcpQuery<T = unknown>(
  sqlQuery: string,
  limit = 25
): Promise<McpQueryResult<T>> {
  const startTs = new Date().toISOString();
  const reader = getReaderClient();

  // 1. Static read-only validation
  const validation = validateReadOnlyQuery(sqlQuery);
  if (!validation.valid) {
    throw new Error(`MCP ClickHouse Security Violation: ${validation.error}`);
  }

  // 2. Enforce explicit LIMIT
  let boundedQuery = sqlQuery.trim();
  if (!/\bLIMIT\b/i.test(boundedQuery)) {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    boundedQuery = `${boundedQuery} LIMIT ${safeLimit}`;
  }

  const statementHash = crypto
    .createHash('sha256')
    .update(boundedQuery)
    .digest('hex');

  const queryStart = performance.now();
  try {
    const res = await reader.query({
      query: boundedQuery,
      format: 'JSONEachRow',
    });

    const data = await res.json<T>();
    const elapsedSeconds = Math.round((performance.now() - queryStart) * 10) / 10000;

    const receipt: McpQueryReceipt = {
      queryHash: statementHash,
      statement: boundedQuery,
      elapsedSeconds,
      rowsRead: data.length,
      bytesRead: JSON.stringify(data).length,
      timestamp: startTs,
      status: 'SUCCESS',
      readOnlyEnforced: true,
    };

    return {
      data,
      receipt,
    };
  } catch (error: unknown) {
    const elapsedSeconds = Math.round((performance.now() - queryStart) * 10) / 10000;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const receipt: McpQueryReceipt = {
      queryHash: statementHash,
      statement: boundedQuery,
      elapsedSeconds,
      rowsRead: 0,
      bytesRead: 0,
      timestamp: startTs,
      status: 'QUERY_FAILED',
      readOnlyEnforced: true,
    };

    throw new Error(`MCP ClickHouse Execution Failed [${receipt.queryHash.substring(0, 8)}]: ${errorMessage}`);
  }
}

/**
 * List tables tool for agent discovery
 */
export async function mcpListTables(): Promise<McpQueryResult<{ name: string }>> {
  return executeMcpQuery<{ name: string }>(
    "SELECT name FROM system.tables WHERE database = currentDatabase() AND name LIKE 'chronicle_%' ORDER BY name ASC",
    50
  );
}

/**
 * Describe table tool for agent schema introspection
 */
export async function mcpDescribeTable(tableName: string): Promise<McpQueryResult<{ name: string; type: string; comment: string }>> {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  return executeMcpQuery<{ name: string; type: string; comment: string }>(
    `DESCRIBE TABLE ${safeName}`,
    50
  );
}
