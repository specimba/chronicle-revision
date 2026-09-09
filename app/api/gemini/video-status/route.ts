import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import { GenerateVideosOperation } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operationName } = body;

    if (!operationName) {
      return NextResponse.json({ error: 'operationName is required' }, { status: 400 });
    }

    const ai = getGeminiClient();
    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });

    const isDone = Boolean(updated.done);
    const error = updated.error;
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    return NextResponse.json({
      success: true,
      done: isDone,
      error: error ? error.message || String(error) : null,
      hasVideo: Boolean(uri),
    });
  } catch (error: any) {
    console.error('Video status polling error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to poll video generation operation' },
      { status: 500 }
    );
  }
}
