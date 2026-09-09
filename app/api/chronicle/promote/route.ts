import { NextRequest, NextResponse } from 'next/server';
import {
  promoteRevision,
  checkClickHouseHealth,
  fetchCanonicalScenes,
  fetchLockedInvariants,
} from '@/lib/clickhouse';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { revisionId, promotedBy = 'LEAD_SUPERVISOR' } = body;

    if (!revisionId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_REVISION_ID: A valid revisionId must be specified for promotion.' },
        { status: 400 }
      );
    }

    const health = await checkClickHouseHealth();
    if (health.status !== 'CONNECTED') {
      return NextResponse.json(
        {
          success: false,
          error: `CLICKHOUSE_UNAVAILABLE: Canonical evidence store is ${health.status}. Promotion requires active ClickHouse writer identity.`,
          status: health.status,
        },
        { status: 503 }
      );
    }

    // Call deterministic promotion operation
    const result = await promoteRevision(revisionId, promotedBy);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          unresolvedInvariants: result.unresolvedInvariants,
          status: 'PROMOTION_REJECTED',
        },
        { status: 400 }
      );
    }

    const [committedScenes, committedInvariants] = await Promise.all([
      fetchCanonicalScenes(),
      fetchLockedInvariants(),
    ]);

    return NextResponse.json({
      success: true,
      status: 'COMMITTED',
      committedRevisionId: result.committedRevisionId,
      commitHash: result.commitHash,
      sequenceNum: result.sequenceNum,
      timestamp: result.timestamp,
      committedScenes,
      committedInvariants,
      receipt: {
        actor: promotedBy,
        action: 'HUMAN_PROMOTION_COMMITTED',
        evidenceStore: 'ClickHouse Canonical (Append-Only)',
        hashValidated: true,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: message,
        status: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
