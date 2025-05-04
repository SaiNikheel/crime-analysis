import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY is not set' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Simple test prompt
    const result = await model.generateContent('Say "API is working correctly" if you can read this.');
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      status: 'success',
      message: text,
      apiKeyPresent: true
    });
  } catch (error) {
    console.error('Gemini API test error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test Gemini API',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 