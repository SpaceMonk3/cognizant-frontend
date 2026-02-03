import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const body: ChatRequest = await request.json();
    
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }

    // Transform messages to OpenAI format
    const openaiMessages = body.messages.map(({ role, content }) => ({
      role,
      content,
    }));

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: openaiMessages,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({
        error: { message: 'Failed to get response from OpenAI' },
      }));
      
      return NextResponse.json(
        { error: errorData.error?.message || 'OpenAI API error' },
        { status: openaiResponse.status }
      );
    }

    const data = await openaiResponse.json();
    
    // Extract the assistant's message
    const assistantMessage = data.choices?.[0]?.message?.content;
    
    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'Invalid response format from OpenAI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
