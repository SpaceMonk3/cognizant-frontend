import { Conversation } from './types';

const STORAGE_KEY = 'chat-conversations';

// Serialize Date objects to ISO strings for localStorage
function serializeConversation(conversation: Conversation): any {
  return {
    ...conversation,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messages: conversation.messages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(),
    })),
  };
}

// Deserialize ISO strings back to Date objects
function deserializeConversation(data: any): Conversation {
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    messages: data.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    })),
  };
}

/**
 * Save all conversations to localStorage
 */
export function saveConversations(conversations: Conversation[]): void {
  try {
    const serialized = conversations.map(serializeConversation);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error('Failed to save conversations to localStorage:', error);
    // Handle quota exceeded or other errors gracefully
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please delete some conversations.');
    }
    throw error;
  }
}

/**
 * Load all conversations from localStorage
 */
export function loadConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.warn('Invalid data format in localStorage, returning empty array');
      return [];
    }

    return parsed.map(deserializeConversation);
  } catch (error) {
    console.error('Failed to load conversations from localStorage:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Save or update a single conversation
 */
export function saveConversation(conversation: Conversation): void {
  const conversations = loadConversations();
  const index = conversations.findIndex((c) => c.id === conversation.id);

  if (index >= 0) {
    conversations[index] = conversation;
  } else {
    conversations.push(conversation);
  }

  saveConversations(conversations);
}

/**
 * Delete a conversation from storage
 */
export function deleteConversation(id: string): void {
  const conversations = loadConversations();
  const filtered = conversations.filter((c) => c.id !== id);
  saveConversations(filtered);
}
