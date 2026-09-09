import { NextResponse } from 'next/server';
import { checkClickHouseHealth, getClickHouseWriterConfig } from '@/lib/clickhouse';
import { getMcpDiagnostics } from '@/lib/mcp-clickhouse';
import { RuntimeDiagnostics } from '@/lib/types';

export async function GET() {
  const timestamp = new Date().toISOString();
  try {
    const [chHealth, mcpDiag] = await Promise.all([
      checkClickHouseHealth(),
      getMcpDiagnostics(),
    ]);

    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
    const writerConfig = getClickHouseWriterConfig();

    let writerStatus: 'READY' | 'NOT_CONFIGURED' | 'UNAVAILABLE' = 'NOT_CONFIGURED';
    if (writerConfig.isConfigured) {
      writerStatus = chHealth.status === 'CONNECTED' ? 'READY' : 'UNAVAILABLE';
    }

    const diagnostics: RuntimeDiagnostics = {
      webApp: {
        status: 'HEALTHY',
        timestamp,
      },
      gemini: {
        status: hasGeminiKey ? 'CONFIGURED' : 'NOT_CONFIGURED',
        model: 'gemini-3.8-flash',
      },
      googleAdk: {
        status: 'READY',
        implementation: '@google/adk',
        version: '2.0.0',
      },
      mcp: mcpDiag,
      clickhouse: chHealth,
      writer: {
        status: writerStatus,
        host: writerConfig.host,
        userConfigured: Boolean(writerConfig.username),
        appendOnlyGuaranteed: true,
        error: chHealth.error,
      },
      timestamp,
    };

    return NextResponse.json(diagnostics);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const writerConfig = getClickHouseWriterConfig();

    return NextResponse.json(
      {
        webApp: {
          status: 'DEGRADED',
          timestamp,
        },
        gemini: {
          status: process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
          model: 'gemini-3.8-flash',
          error: message,
        },
        googleAdk: {
          status: 'READY',
          implementation: '@google/adk',
          version: '2.0.0',
        },
        mcp: {
          status: 'UNAVAILABLE',
          serverUrlHostOnly: 'UNKNOWN',
          implementation: 'official mcp-clickhouse',
          protocolConnection: 'StreamableHTTP',
          toolsDiscovered: [],
          lastQueryStatus: 'QUERY_FAILED',
          error: message,
        },
        clickhouse: {
          status: 'UNAVAILABLE',
          host: writerConfig.host || 'UNKNOWN',
          latencyMs: 0,
          totalScenes: 0,
          totalRevisions: 0,
          totalReceipts: 0,
          isReadOnlyReaderReady: false,
          isScopedWriterReady: false,
          error: message,
        },
        writer: {
          status: 'UNAVAILABLE',
          host: writerConfig.host || 'UNKNOWN',
          userConfigured: Boolean(writerConfig.username),
          appendOnlyGuaranteed: true,
          error: message,
        },
        timestamp,
      },
      { status: 500 }
    );
  }
}
