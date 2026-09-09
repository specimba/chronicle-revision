import { NextRequest, NextResponse } from 'next/server';
import { runChronicleAgentRevision } from '@/lib/chronicle-agent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt || 'Shift the revelation beat from Scene 12 to Scene 18; transition Scene 12 from night deluge rain into quiet dawn sunrise.';
    const targetScene = Number(body.targetScene) || 12;
    const destinationScene = Number(body.destinationScene) || 18;

    // Check Gemini API Key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: 'GEMINI_NOT_CONFIGURED',
          message: 'GEMINI_API_KEY environment variable is required to execute gemini-3.8-flash revision orchestration.',
          status: 'NOT_CONFIGURED',
          runtimeState: 'NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Execute the bounded Chronicle Agent (Read-only MCP evidence exploration)
    const result = await runChronicleAgentRevision(prompt, targetScene, destinationScene);

    return NextResponse.json({
      success: true,
      revisionId: result.revisionId,
      runtimeState: result.runtimeState, // 'READY_TO_PROMOTE'
      modelUsed: result.modelUsed,
      modelLatencyMs: result.modelLatencyMs,
      revisionPatch: result.revisionPatch,
      creativeContract: result.creativeContract,
      repairManifest: result.repairManifest,
      invariantEvaluations: result.invariantEvaluations,
      boundedHops: result.boundedHops,
      mcpReceipts: result.mcpReceipts,
      mcpDiagnostics: result.mcpDiagnostics,
      timestamp: result.timestamp,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: message,
        status: 'ORCHESTRATION_FAILED',
        runtimeState: 'QUERY_FAILED',
      },
      { status: 500 }
    );
  }
}
