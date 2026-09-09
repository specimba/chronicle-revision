import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      audioBase64,
      mimeType = 'audio/webm',
      instructions = 'Transcribe this audio verbatim. Include speaker labels and scene timing cues if audible.',
      model = 'gemini-3.5-transcribe',
    } = body;

    if (!audioBase64) {
      return NextResponse.json({ error: 'audioBase64 payload is required' }, { status: 400 });
    }

    const ai = getGeminiClient();
    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

    const audioPart = {
      inlineData: {
        mimeType,
        data: cleanBase64,
      },
    };

    const targetModel = model || 'gemini-3.5-transcribe';

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: {
        parts: [
          audioPart,
          {
            text: instructions,
          },
        ],
      },
    });

    const transcript = response.text || '';

    return NextResponse.json({
      success: true,
      transcript,
      modelUsed: targetModel,
    });
  } catch (error: any) {
    console.error('Audio transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
