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
 * @throws {Error} If storage quota is exceeded or other storage errors occur
 */
export function saveConversations(conversations: Conversation[]): void {
  try {
    const serialized = conversations.map(serializeConversation);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    // Check if it's a QuotaExceededError
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Try to free up space by keeping only the most recent conversations
      const MAX_CONVERSATIONS = 50;
      if (conversations.length > MAX_CONVERSATIONS) {
        // Sort by updatedAt and keep only the most recent
        const sorted = [...conversations].sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
        );
        const limited = sorted.slice(0, MAX_CONVERSATIONS);
        try {
          const serialized = limited.map(serializeConversation);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
          console.warn(`Storage quota exceeded. Kept only the ${MAX_CONVERSATIONS} most recent conversations.`);
          return;
        } catch (retryError) {
          throw new Error('Storage quota exceeded. Please delete some conversations to free up space.');
        }
      }
      throw new Error('Storage quota exceeded. Please delete some conversations to free up space.');
    }
    
    // Handle other storage errors
    console.error('Failed to save conversations to localStorage:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to save conversations. Please try again.');
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
