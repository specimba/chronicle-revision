import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import crypto from 'node:crypto';
import {
  checkClickHouseHealth,
  fetchLockedInvariants,
  performBoundedHopExploration,
  appendCreativeContract,
  appendValidationReceipt,
  getWriterClient,
} from '@/lib/clickhouse';
import { InvariantStatus } from '@/lib/types';

// JSON schema for structured Gemini 3.8 Flash orchestration
const revisionOutputSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    revisionPatch: {
      type: Type.OBJECT,
      properties: {
        sourceScene: { type: Type.INTEGER },
        targetScene: { type: Type.INTEGER },
        summary: { type: Type.STRING },
        affectedDepartments: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        rupturesIdentified: { type: Type.INTEGER },
        continuityModifications: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              target: { type: Type.STRING },
              currentFact: { type: Type.STRING },
              proposedFact: { type: Type.STRING },
              department: { type: Type.STRING },
            },
            required: ['target', 'currentFact', 'proposedFact', 'department'],
          },
        },
      },
      required: ['sourceScene', 'targetScene', 'summary', 'affectedDepartments', 'rupturesIdentified', 'continuityModifications'],
    },
    creativeContract: {
      type: Type.OBJECT,
      properties: {
        referenceIdentity: { type: Type.STRING },
        referenceStructure: { type: Type.STRING },
        referenceEnvironment: { type: Type.STRING },
        referenceStyle: { type: Type.STRING },
        mutableIntent: { type: Type.STRING },
      },
      required: ['referenceIdentity', 'referenceStructure', 'referenceEnvironment', 'referenceStyle', 'mutableIntent'],
    },
    repairManifest: {
      type: Type.OBJECT,
      properties: {
        recommendedCandidate: { type: Type.STRING },
        estimatedTotalHours: { type: Type.NUMBER },
        candidates: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              description: { type: Type.STRING },
              timeHours: { type: Type.NUMBER },
              costEst: { type: Type.STRING },
              status: { type: Type.STRING },
            },
            required: ['id', 'name', 'subtitle', 'description', 'timeHours', 'costEst', 'status'],
          },
        },
      },
      required: ['recommendedCandidate', 'estimatedTotalHours', 'candidates'],
    },
    invariantEvaluations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          invariantId: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['PASS', 'FAIL', 'UNKNOWN'] },
          validationDetails: { type: Type.STRING },
        },
        required: ['invariantId', 'status', 'validationDetails'],
      },
    },
  },
  required: ['revisionPatch', 'creativeContract', 'repairManifest', 'invariantEvaluations'],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt || 'Shift the revelation beat from Scene 12 to Scene 18; transition Scene 12 from night deluge rain into quiet dawn sunrise.';
    const revisionId = body.revisionId || crypto.randomUUID();

    // Check Gemini API Key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: 'GEMINI_NOT_CONFIGURED',
          message: 'GEMINI_API_KEY environment variable is required to execute gemini-3.8-flash revision orchestration. Missing evidence must never be promoted to PASS.',
          status: 'NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Check ClickHouse
    const chHealth = await checkClickHouseHealth();

    // Fetch existing locked invariants to provide to the model
    let existingInvariants: Array<{ invariantId: string; name: string; department: string; ruleExpression: string }> = [];
    if (chHealth.status === 'CONNECTED') {
      const invs = await fetchLockedInvariants();
      existingInvariants = invs.map((i) => ({
        invariantId: i.invariantId,
        name: i.name,
        department: i.department,
        ruleExpression: i.ruleExpression,
      }));
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `You are Chronicle ADK, the authoritative continuity & revision orchestration engine for film & virtual production.
Your mandate:
1. Parse the director's natural language revision request into a structured RevisionPatch.
2. Formulate a typed, versioned CreativeContract: strictly separate immutable reference constraints (identity, structure, environment, style) from mutable requested changes.
3. Generate a RepairManifest evaluating tactical candidates (A: Optical Sunburst + ADR Sc 13, B: Dry Coat Swap + CGI Moisture, C: Unit B Splinter Pickups, D: Surveillance CCTV Bridge).
4. Evaluate locked invariants: For each invariant, verify whether the proposed revision and repair candidate satisfies the physical/logical constraint. Return PASS, FAIL, or UNKNOWN. Missing or unverified evidence MUST remain UNKNOWN or FAIL; never fabricate PASS.`;

    const contents = `Director Revision Request:
"${prompt}"

Canonical Production Locked Invariants:
${JSON.stringify(existingInvariants, null, 2)}

Analyze this revision cascade, generate structured RevisionPatch, typed CreativeContract, RepairManifest, and invariant evaluations.`;

    const modelStartTime = performance.now();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: revisionOutputSchema,
        temperature: 0.1,
      },
    });
    const modelLatencyMs = Math.round((performance.now() - modelStartTime) * 100) / 100;

    const responseText = response.text || '{}';
    const parsed = JSON.parse(responseText);

    // Run official MCP ClickHouse bounded 3-hop exploration
    let boundedHops = null;
    if (chHealth.status === 'CONNECTED') {
      boundedHops = await performBoundedHopExploration(
        revisionId,
        parsed.revisionPatch.sourceScene || 12,
        parsed.revisionPatch.targetScene || 18
      );

      // Record CreativeContract to ClickHouse
      await appendCreativeContract({
        version: 1,
        revisionId,
        referenceIdentity: parsed.creativeContract.referenceIdentity,
        referenceStructure: parsed.creativeContract.referenceStructure,
        referenceEnvironment: parsed.creativeContract.referenceEnvironment,
        referenceStyle: parsed.creativeContract.referenceStyle,
        mutableIntent: parsed.creativeContract.mutableIntent,
      });

      // Record Validation Receipts to ClickHouse
      for (const ev of parsed.invariantEvaluations) {
        await appendValidationReceipt({
          revisionId,
          invariantId: ev.invariantId,
          status: ev.status as InvariantStatus,
          latencyMs: modelLatencyMs,
          validatorAgent: 'gemini-3.8-flash:adk-validator',
          validationDetails: ev.validationDetails,
        });
      }

      // Record Revision row (Append-only)
      const writer = getWriterClient();
      await writer.insert({
        table: 'chronicle_revisions',
        values: [
          {
            revision_id: revisionId,
            parent_revision_id: '00000000-0000-0000-0000-000000000001',
            sequence_num: 2,
            revision_type: 'SIMULATION_BRANCH',
            prompt,
            created_by: 'DIRECTOR',
            status: 'SIMULATING',
            patch_json: JSON.stringify(parsed.revisionPatch),
            repair_manifest_json: JSON.stringify(parsed.repairManifest),
            commit_hash: '',
            promoted_by: '',
            committed_at: null,
          },
        ],
        format: 'JSONEachRow',
      });
    }

    return NextResponse.json({
      success: true,
      revisionId,
      modelUsed: 'gemini-3.8-flash',
      modelLatencyMs,
      revisionPatch: parsed.revisionPatch,
      creativeContract: parsed.creativeContract,
      repairManifest: parsed.repairManifest,
      invariantEvaluations: parsed.invariantEvaluations,
      boundedHops,
      clickhouseSynced: chHealth.status === 'CONNECTED',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: message,
        status: 'ORCHESTRATION_FAILED',
      },
      { status: 500 }
    );
  }
}
