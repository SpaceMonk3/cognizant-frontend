export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  messages: Omit<Message, 'id' | 'timestamp'>[];
}

export interface ChatResponse {
  message: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
