import { ChatRequest, ChatResponse } from './types';

/**
 * Sends a chat request to the OpenAI API via Next.js API route
 * @param messages Array of messages user and chatbot
 * @returns Promise resolving to the AI response
 */
export async function sendChatRequest(
  messages: ChatRequest['messages']
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'An error occurred while processing your request',
    }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data: ChatResponse = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return data.message;
}
