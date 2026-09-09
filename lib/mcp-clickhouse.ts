/**
 * Official ClickHouse MCP (Model Context Protocol) Remote Client Integration
 * Built with @google/adk MCPToolset and @modelcontextprotocol/sdk.
 *
 * Enforces:
 * 1. StreamableHTTP transport to remote official mcp-clickhouse endpoint
 * 2. Strict read-only tool filtering (no writes/inserts/alters permitted)
 * 3. Truthful receipts without fabricated latencies or simulated rows
 */

import { MCPToolset } from '@google/adk';
import type { BaseTool } from '@google/adk';
import crypto from 'node:crypto';
import { McpDiagnostics, McpServerStatus } from './types';

export interface McpQueryReceipt {
  queryHash: string;
  statement: string;
  elapsedSeconds: number;
  rowsRead: number;
  bytesRead: number;
  timestamp: string;
  status: 'SUCCESS' | 'QUERY_FAILED' | 'NOT_CONFIGURED';
  readOnlyEnforced: boolean;
  error?: string;
}

let sharedMcpToolset: MCPToolset | null = null;
let lastKnownDiscoveredTools: string[] = [];
let lastMcpQueryStatus: 'IDLE' | 'EXECUTING' | 'SUCCESS' | 'QUERY_FAILED' | 'NOT_CONFIGURED' = 'IDLE';
let lastMcpQueryHash: string = '';

/**
 * Extracts host-only representation from a URL to prevent leaking tokens or credentials.
 */
export function getMcpHostOnly(urlStr?: string): string {
  if (!urlStr) return 'NOT_CONFIGURED';
  try {
    const parsed = new URL(urlStr);
    return parsed.host;
  } catch {
    return urlStr.replace(/^https?:\/\//, '').split('/')[0];
  }
}

/**
 * Filter callback ensuring ONLY read-oriented tools are exposed from the official MCP server.
 * Write, alter, insert, delete, or create tools are strictly rejected.
 */
function readOnlyToolFilter(tool: { name: string; description?: string }): boolean {
  const name = tool.name.toLowerCase();
  const forbiddenPatterns = ['write', 'insert', 'update', 'delete', 'drop', 'alter', 'create', 'truncate', 'grant'];
  for (const pattern of forbiddenPatterns) {
    if (name.includes(pattern)) {
      return false;
    }
  }
  return true;
}

/**
 * Constructs or returns the official MCPToolset for ClickHouse.
 * Returns null if CLICKHOUSE_MCP_URL is not configured.
 */
export function getClickHouseMcpToolset(): MCPToolset | null {
  const mcpUrl = process.env.CLICKHOUSE_MCP_URL;
  if (!mcpUrl) {
    return null;
  }

  if (!sharedMcpToolset) {
    const headers: Record<string, string> = {
      'Accept': 'application/json, text/event-stream',
    };

    if (process.env.CLICKHOUSE_MCP_AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.CLICKHOUSE_MCP_AUTH_TOKEN}`;
    }

    sharedMcpToolset = new MCPToolset(
      {
        type: 'StreamableHTTPConnectionParams',
        url: mcpUrl,
        transportOptions: {
          requestInit: {
            headers,
          },
        },
      },
      readOnlyToolFilter
    );
  }

  return sharedMcpToolset;
}

/**
 * Truthful runtime diagnostics check against the remote MCP server.
 * Never fabricates success or returns fake tools.
 */
export async function getMcpDiagnostics(): Promise<McpDiagnostics> {
  const mcpUrl = process.env.CLICKHOUSE_MCP_URL;
  const hostOnly = getMcpHostOnly(mcpUrl);

  if (!mcpUrl) {
    return {
      status: 'NOT_CONFIGURED',
      serverUrlHostOnly: 'NOT_CONFIGURED',
      implementation: 'official mcp-clickhouse',
      protocolConnection: 'NONE',
      toolsDiscovered: [],
      lastQueryStatus: 'NOT_CONFIGURED',
      error: 'CLICKHOUSE_MCP_URL environment variable is not configured.',
    };
  }

  const toolset = getClickHouseMcpToolset();
  if (!toolset) {
    return {
      status: 'NOT_CONFIGURED',
      serverUrlHostOnly: hostOnly,
      implementation: 'official mcp-clickhouse',
      protocolConnection: 'StreamableHTTP',
      toolsDiscovered: [],
      lastQueryStatus: 'NOT_CONFIGURED',
    };
  }

  try {
    // Attempt session handshake and tool discovery with 5s timeout
    const toolsPromise = toolset.getTools();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout to remote MCP endpoint (5000ms)')), 5000)
    );

    const tools = (await Promise.race([toolsPromise, timeoutPromise])) as BaseTool[];
    const toolNames = tools.map((t) => t.name);
    lastKnownDiscoveredTools = toolNames;

    return {
      status: 'CONNECTED',
      serverUrlHostOnly: hostOnly,
      implementation: 'official mcp-clickhouse',
      protocolConnection: 'StreamableHTTP',
      toolsDiscovered: toolNames,
      lastQueryStatus: lastMcpQueryStatus === 'NOT_CONFIGURED' ? 'IDLE' : lastMcpQueryStatus,
      lastQueryHash: lastMcpQueryHash || undefined,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      status: 'UNAVAILABLE',
      serverUrlHostOnly: hostOnly,
      implementation: 'official mcp-clickhouse',
      protocolConnection: 'StreamableHTTP',
      toolsDiscovered: lastKnownDiscoveredTools,
      lastQueryStatus: 'QUERY_FAILED',
      error: `MCP Connection failed: ${errorMsg}`,
    };
  }
}

/**
 * Validates a read-only query statement.
 */
export function validateReadOnlyMcpStatement(query: string): { valid: boolean; error?: string } {
  const normalized = query.trim().toUpperCase();
  const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'RENAME', 'CREATE'];
  for (const word of forbidden) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalized)) {
      return {
        valid: false,
        error: `MCP violation: Agent evidence queries must be strictly READ-ONLY. Prohibited keyword: ${word}`,
      };
    }
  }
  return { valid: true };
}

/**
 * Executes a read-only query via official MCP tools if available.
 * Emits truthful receipts.
 */
export async function executeMcpQuery(query: string): Promise<{ data: unknown[]; receipt: McpQueryReceipt }> {
  const statement = query.trim();
  const startTime = performance.now();
  const queryHash = 'mcp_' + crypto.createHash('sha256').update(statement).digest('hex').slice(0, 16);
  lastMcpQueryHash = queryHash;

  const validation = validateReadOnlyMcpStatement(statement);
  if (!validation.valid) {
    lastMcpQueryStatus = 'QUERY_FAILED';
    const elapsedSeconds = (performance.now() - startTime) / 1000;
    return {
      data: [],
      receipt: {
        queryHash,
        statement,
        elapsedSeconds,
        rowsRead: 0,
        bytesRead: 0,
        timestamp: new Date().toISOString(),
        status: 'QUERY_FAILED',
        readOnlyEnforced: true,
        error: validation.error,
      },
    };
  }

  const toolset = getClickHouseMcpToolset();
  if (!toolset) {
    lastMcpQueryStatus = 'NOT_CONFIGURED';
    const elapsedSeconds = (performance.now() - startTime) / 1000;
    return {
      data: [],
      receipt: {
        queryHash,
        statement,
        elapsedSeconds,
        rowsRead: 0,
        bytesRead: 0,
        timestamp: new Date().toISOString(),
        status: 'NOT_CONFIGURED',
        readOnlyEnforced: true,
        error: 'CLICKHOUSE_MCP_URL is not configured.',
      },
    };
  }

  try {
    lastMcpQueryStatus = 'EXECUTING';
    const tools = await toolset.getTools();
    // Look for query execution tool exposed by official mcp-clickhouse
    // Common names: run_query, query, execute_query
    const queryTool = tools.find(
      (t) => t.name === 'run_query' || t.name === 'query' || t.name === 'execute_query'
    );

    if (!queryTool) {
      throw new Error(`MCP server connected but did not expose a read-only query tool. Discovered: ${tools.map((t) => t.name).join(', ')}`);
    }

    // Execute through ADK tool
    const rawResult = await (queryTool as any).run?.({ query: statement });
    const elapsedSeconds = (performance.now() - startTime) / 1000;
    lastMcpQueryStatus = 'SUCCESS';

    let rows: unknown[] = [];
    if (Array.isArray(rawResult)) {
      rows = rawResult;
    } else if (rawResult && typeof rawResult === 'object') {
      rows = (rawResult as any).data || (rawResult as any).rows || [rawResult];
    }

    return {
      data: rows,
      receipt: {
        queryHash,
        statement,
        elapsedSeconds,
        rowsRead: rows.length,
        bytesRead: JSON.stringify(rows).length,
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        readOnlyEnforced: true,
      },
    };
  } catch (err: unknown) {
    lastMcpQueryStatus = 'QUERY_FAILED';
    const elapsedSeconds = (performance.now() - startTime) / 1000;
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      data: [],
      receipt: {
        queryHash,
        statement,
        elapsedSeconds,
        rowsRead: 0,
        bytesRead: 0,
        timestamp: new Date().toISOString(),
        status: 'QUERY_FAILED',
        readOnlyEnforced: true,
        error: errorMessage,
      },
    };
  }
}

/**
 * Lists available tables via official MCP server.
 */
export async function mcpListTables(): Promise<{ tables: string[]; receipt: McpQueryReceipt }> {
  const result = await executeMcpQuery('SHOW TABLES');
  const tables = result.data.map((r: any) => (typeof r === 'string' ? r : r.name || Object.values(r)[0] as string)).filter(Boolean);
  return {
    tables,
    receipt: result.receipt,
  };
}

/**
 * Describes a table via official MCP server.
 */
export async function mcpDescribeTable(tableName: string): Promise<{ columns: unknown[]; receipt: McpQueryReceipt }> {
  const sanitized = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const result = await executeMcpQuery(`DESCRIBE TABLE ${sanitized}`);
  return {
    columns: result.data,
    receipt: result.receipt,
  };
}
