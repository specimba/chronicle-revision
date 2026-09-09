import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      imageBase64,
      imageMimeType = 'image/png',
      aspectRatio = '16:9', // '16:9' or '9:16'
      resolution = '720p',
      model = 'veo-3.1-fast-generate-preview',
    } = body;

    const ai = getGeminiClient();

    const allowedAspectRatios = ['16:9', '9:16'];
    const selectedAspectRatio = allowedAspectRatios.includes(aspectRatio)
      ? aspectRatio
      : '16:9';

    // Models to attempt: primary model from prompt, followed by fallbacks
    const candidateModels = [
      model,
      'veo-3.1-fast-generate-preview',
      'veo-3.1-lite-generate-preview',
      'veo-3.1-generate-preview',
    ].filter((v, i, a) => a.indexOf(v) === i);

    let operation: any = null;
    let successfulModel = '';
    let lastError: any = null;

    for (const targetModel of candidateModels) {
      try {
        const payload: any = {
          model: targetModel,
          config: {
            numberOfVideos: 1,
            resolution: resolution || '720p',
            aspectRatio: selectedAspectRatio,
          },
        };

        if (prompt) {
          payload.prompt = prompt;
        }

        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
          payload.image = {
            imageBytes: cleanBase64,
            mimeType: imageMimeType,
          };
        }

        operation = await ai.models.generateVideos(payload);
        successfulModel = targetModel;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Veo model ${targetModel} attempt failed:`, err?.message || err);
      }
    }

    if (!operation || !operation.name) {
      return NextResponse.json(
        {
          error:
            lastError?.message ||
            'Failed to initiate Veo video generation. Ensure paid model access is enabled.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      operationName: operation.name,
      modelUsed: successfulModel,
      aspectRatio: selectedAspectRatio,
    });
  } catch (error: any) {
    console.error('Veo video generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    );
  }
}
