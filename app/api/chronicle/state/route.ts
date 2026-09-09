import { NextResponse } from 'next/server';
import {
  checkClickHouseHealth,
  fetchCanonicalScenes,
  fetchLockedInvariants,
  performBoundedHopExploration,
} from '@/lib/clickhouse';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const revisionId = searchParams.get('revisionId') || undefined;

    const health = await checkClickHouseHealth();

    if (health.status !== 'CONNECTED') {
      return NextResponse.json(
        {
          status: 'DEGRADED',
          health,
          scenes: [],
          invariants: [],
          boundedHops: null,
          error: `ClickHouse canonical store is ${health.status}. Error: ${health.error || 'Connection failed'}`,
        },
        { status: 200 }
      );
    }

    const [scenes, invariants, hopData] = await Promise.all([
      fetchCanonicalScenes(),
      fetchLockedInvariants(revisionId),
      performBoundedHopExploration(revisionId || '00000000-0000-0000-0000-000000000001', 12, 18),
    ]);

    return NextResponse.json({
      status: 'SYNCHRONIZED',
      health,
      scenes,
      invariants,
      boundedHops: hopData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        status: 'QUERY_FAILED',
        error: message,
        scenes: [],
        invariants: [],
      },
      { status: 500 }
    );
  }
}
