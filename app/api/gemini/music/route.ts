import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      model = 'lyria-3-clip-preview',
      imageBase64,
      imageMimeType = 'image/jpeg',
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const ai = getGeminiClient();
    const targetModel =
      model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

    let contents: any;
    if (imageBase64) {
      contents = {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
              mimeType: imageMimeType,
            },
          },
        ],
      };
    } else {
      contents = prompt;
    }

    const response = await ai.models.generateContentStream({
      model: targetModel,
      contents,
    });

    let audioBase64 = '';
    let lyrics = '';
    let mimeType = 'audio/wav';

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    if (!audioBase64) {
      return NextResponse.json(
        {
          error:
            'No audio returned from Lyria model. Ensure the Lyria model preview is enabled on your project.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      audioBase64,
      mimeType,
      lyrics,
      model: targetModel,
    });
  } catch (error: any) {
    console.error('Lyria Music Generation error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate music with Lyria',
      },
      { status: 500 }
    );
  }
}
