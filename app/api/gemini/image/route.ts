import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      mode = 'create',
      imageBase64,
      imageMimeType = 'image/png',
      aspectRatio = '1:1',
      model = 'gemini-3.1-flash-image-preview',
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const ai = getGeminiClient();

    // Models ordered by preference
    const candidateModels = [
      model,
      'gemini-3.1-flash-image-preview',
      'gemini-3.1-flash-image',
      'gemini-3.1-flash-lite-image',
    ].filter((v, i, a) => a.indexOf(v) === i);

    let parts: any[] = [];
    if (mode === 'edit' && imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: imageMimeType,
        },
      });
    }
    parts.push({ text: prompt });

    let response: any = null;
    let successfulModel = '';
    let lastError: any = null;

    for (const targetModel of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: targetModel,
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
              imageSize: '1K',
            },
          },
        });
        successfulModel = targetModel;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${targetModel} attempt failed:`, err?.message || err);
      }
    }

    if (!response) {
      return NextResponse.json(
        {
          error:
            lastError?.message ||
            'Failed to generate image. Please verify your Gemini API key and access privileges.',
        },
        { status: 500 }
      );
    }

    let generatedImageUrl = '';
    let textResponse = '';

    const candidateParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of candidateParts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textResponse += part.text;
      }
    }

    if (!generatedImageUrl) {
      return NextResponse.json(
        {
          error:
            textResponse ||
            'No image returned by the model. Try refining your visual prompt.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: generatedImageUrl,
      textResponse,
      modelUsed: successfulModel,
      aspectRatio,
    });
  } catch (error: any) {
    console.error('Image generation/edit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process image generation request' },
      { status: 500 }
    );
  }
}
