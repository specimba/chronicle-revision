import { NextRequest, NextResponse } from 'next/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { getReaderClient, validateReadOnlyQuery } from '@/lib/clickhouse';
import crypto from 'node:crypto';

// Shared MCP Server instance with official tool signatures
function createOfficialMcpServer(): McpServer {
  const server = new McpServer({
    name: 'mcp-clickhouse',
    version: '0.2.0',
  });

  // Tool 1: run_query (Official ClickHouse MCP tool)
  server.tool(
    'run_query',
    'Execute a strictly read-only SQL query against ClickHouse Cloud (chronicle database)',
    {
      query: z.string().describe('The read-only SQL query (SELECT, SHOW, DESCRIBE)'),
    },
    async ({ query }) => {
      const validation = validateReadOnlyQuery(query);
      if (!validation.valid) {
        throw new Error(validation.error || 'Write queries prohibited in read-only MCP server.');
      }

      const client = getReaderClient();
      const res = await client.query({
        query,
        format: 'JSONEachRow',
      });
      const rows = await res.json();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(rows),
          },
        ],
      };
    }
  );

  // Tool 2: list_databases
  server.tool(
    'list_databases',
    'List all accessible databases in the ClickHouse cluster',
    {},
    async () => {
      const client = getReaderClient();
      const res = await client.query({
        query: 'SHOW DATABASES',
        format: 'JSONEachRow',
      });
      const rows = await res.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(rows) }],
      };
    }
  );

  // Tool 3: list_tables
  server.tool(
    'list_tables',
    'List tables in the chronicle database',
    {
      database: z.string().optional().describe('Optional database name; defaults to chronicle'),
    },
    async ({ database = 'chronicle' }) => {
      const sanitized = database.replace(/[^a-zA-Z0-9_]/g, '');
      const client = getReaderClient();
      const res = await client.query({
        query: `SHOW TABLES FROM ${sanitized}`,
        format: 'JSONEachRow',
      });
      const rows = await res.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(rows) }],
      };
    }
  );

  // Tool 4: describe_table
  server.tool(
    'describe_table',
    'Describe schema of a table in the chronicle database',
    {
      table: z.string().describe('Table name to describe'),
      database: z.string().optional().describe('Database name; defaults to chronicle'),
    },
    async ({ table, database = 'chronicle' }) => {
      const sanitizedTable = table.replace(/[^a-zA-Z0-9_]/g, '');
      const sanitizedDb = database.replace(/[^a-zA-Z0-9_]/g, '');
      const client = getReaderClient();
      const res = await client.query({
        query: `DESCRIBE TABLE ${sanitizedDb}.${sanitizedTable}`,
        format: 'JSONEachRow',
      });
      const rows = await res.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(rows) }],
      };
    }
  );

  return server;
}

let mcpServerInstance: McpServer | null = null;
let mcpTransportInstance: WebStandardStreamableHTTPServerTransport | null = null;

function getTransport(): { server: McpServer; transport: WebStandardStreamableHTTPServerTransport } {
  if (!mcpServerInstance || !mcpTransportInstance) {
    mcpServerInstance = createOfficialMcpServer();
    mcpTransportInstance = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });
    // Connect server to transport
    mcpServerInstance.connect(mcpTransportInstance).catch((err) => {
      console.error('Failed to connect MCP server to transport:', err);
    });
  }
  return { server: mcpServerInstance, transport: mcpTransportInstance };
}

// Bearer token validation helper
function isAuthorized(req: Request): boolean {
  const expectedToken = process.env.CLICKHOUSE_MCP_AUTH_TOKEN;
  if (!expectedToken) return true; // If no token configured, allow open internal access

  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader) return false;

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1] === expectedToken;
  }
  return false;
}

export async function POST(req: Request): Promise<Response> {
  // Allow internal requests or validate bearer token
  const url = new URL(req.url);
  const isInternal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (!isInternal && !isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing Bearer token' }, { status: 401 });
  }

  const { transport } = getTransport();
  return transport.handleRequest(req);
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  // Health check endpoint for official MCP server
  if (url.searchParams.get('health') === '1' || url.pathname.endsWith('/health')) {
    return NextResponse.json({
      status: 'ok',
      server: 'mcp-clickhouse',
      version: '0.2.0',
      transport: 'StreamableHTTP',
      readOnly: true,
    });
  }

  const isInternal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (!isInternal && !isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing Bearer token' }, { status: 401 });
  }

  const { transport } = getTransport();
  return transport.handleRequest(req);
}
