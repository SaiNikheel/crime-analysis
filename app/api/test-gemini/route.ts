import { NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Hello, how are you?');
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({ message: text });
  } catch (error) {
    console.error('Error in test-gemini route:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
} 