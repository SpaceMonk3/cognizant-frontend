/**
 * Generate a conversation title from the first user message
 * @param firstMessage The first user message content
 * @returns A truncated title or "New Chat" if empty
 */
export function generateConversationTitle(firstMessage: string): string {
  if (!firstMessage || !firstMessage.trim()) {
    return 'New Chat';
  }

  // Remove extra whitespace and newlines
  const cleaned = firstMessage.trim().replace(/\s+/g, ' ');
  
  // Truncate to 50 characters
  if (cleaned.length <= 50) {
    return cleaned;
  }

  return cleaned.substring(0, 50).trim() + '...';
}
