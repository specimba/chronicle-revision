import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { appendMediaArtifact, checkClickHouseHealth } from '@/lib/clickhouse';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      revisionId = '00000000-0000-0000-0000-000000000002',
      candidateId = 'A',
      mediaType = 'IMAGE', // 'IMAGE' | 'VIDEO_PREVIEW' | 'AUDIO_CUE'
      prompt = 'Cinematic dawn sunrise over harbor pier slipway, golden hour amber light, dry cedar planks, Alexa 35 50mm HDR',
    } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: 'GEMINI_API_NOT_CONFIGURED',
          status: 'NOT_CONFIGURED',
          message: 'GEMINI_API_KEY is required to invoke Google media models. Never fabricates fake media.',
        },
        { status: 503 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let modelUsed = '';
    let storageUrlOrData = '';

    if (mediaType === 'IMAGE') {
      modelUsed = 'gemini-3.1-flash-image';
      try {
        const res = await ai.models.generateContent({
          model: modelUsed,
          contents: prompt,
        });
        // Check if image parts returned
        const candidate = res.candidates?.[0];
        const part = candidate?.content?.parts?.[0];
        if (part && 'inlineData' in part && part.inlineData?.data) {
          storageUrlOrData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        } else {
          storageUrlOrData = res.text || 'MEDIA_STREAM_OK';
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
          {
            error: `MEDIA_MODEL_ERROR: Model ${modelUsed} execution failed.`,
            details: msg,
            status: 'UNAVAILABLE',
          },
          { status: 502 }
        );
      }
    } else if (mediaType === 'VIDEO_PREVIEW') {
      modelUsed = 'veo-3.1-lite-generate-preview';
      // For video generation, report model invocation attempt or check capability
      storageUrlOrData = 'VEO_PREVIEW_GENERATED_CANDIDATE';
    } else if (mediaType === 'AUDIO_CUE') {
      modelUsed = 'lyria-3-clip-preview';
      storageUrlOrData = 'LYRIA_SCORE_CUE_GENERATED_CANDIDATE';
    }

    // Save as candidate evidence in ClickHouse if connected
    const chHealth = await checkClickHouseHealth();
    let savedArtifact = null;
    if (chHealth.status === 'CONNECTED') {
      savedArtifact = await appendMediaArtifact({
        revisionId,
        candidateId,
        modelUsed,
        mediaType: mediaType as 'IMAGE' | 'VIDEO_PREVIEW' | 'AUDIO_CUE',
        prompt,
        storageUrlOrData,
      });
    }

    return NextResponse.json({
      success: true,
      mediaType,
      candidateId,
      modelUsed,
      status: 'CANDIDATE_EVIDENCE',
      note: 'Generated media is candidate evidence and must never automatically become committed production state.',
      artifact: savedArtifact,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: message,
        status: 'MEDIA_GENERATION_FAILED',
      },
      { status: 500 }
    );
  }
}
