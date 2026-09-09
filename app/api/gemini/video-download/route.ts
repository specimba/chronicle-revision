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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    const ai = getGeminiClient();
    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return NextResponse.json(
        { error: 'Video URI not available yet or generation failed.' },
        { status: 404 }
      );
    }

    const videoRes = await fetch(uri, {
      headers: {
        'x-goog-api-key': apiKey,
      },
    });

    if (!videoRes.ok) {
      const errText = await videoRes.text();
      return NextResponse.json(
        { error: `Failed to download video bytes: ${videoRes.statusText}`, details: errText },
        { status: videoRes.status }
      );
    }

    const arrayBuffer = await videoRes.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'inline; filename="chronicle-generated-video.mp4"',
      },
    });
  } catch (error: any) {
    console.error('Video download error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download generated video' },
      { status: 500 }
    );
  }
}
