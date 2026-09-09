import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: 'GEMINI_NOT_CONFIGURED',
          message: 'GEMINI_API_KEY environment variable is required to execute Gemini orchestration. Missing evidence is never promoted to PASS.',
          status: 'NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt || 'Parse continuity revision patch for Scene 12 pierhead stand transition from night rain to sunrise dawn.',
    });

    return NextResponse.json({
      success: true,
      model: 'gemini-3.8-flash',
      text: response.text,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: message,
        status: 'ORCHESTRATION_FAILED',
      },
      { status: 500 }
    );
  }
}
