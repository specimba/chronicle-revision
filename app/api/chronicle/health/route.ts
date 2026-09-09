import { NextResponse } from 'next/server';
import { checkClickHouseHealth } from '@/lib/clickhouse';

export async function GET() {
  try {
    const chHealth = await checkClickHouseHealth();

    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

    return NextResponse.json({
      clickhouse: chHealth,
      gemini: {
        status: hasGeminiKey ? 'CONFIGURED' : 'NOT_CONFIGURED',
        model: 'gemini-3.8-flash',
        orchestrationReady: hasGeminiKey,
        mediaModels: {
          image: 'gemini-3.1-flash-image',
          video: 'veo-3.1-lite-generate-preview',
          audio: 'lyria-3-clip-preview',
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        clickhouse: {
          status: 'QUERY_FAILED',
          host: 'UNKNOWN',
          latencyMs: 0,
          totalScenes: 0,
          totalRevisions: 0,
          totalReceipts: 0,
          isReadOnlyReaderReady: false,
          isScopedWriterReady: false,
          error: message,
        },
        gemini: {
          status: process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
          model: 'gemini-3.8-flash',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
