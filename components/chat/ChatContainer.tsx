'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Message, Conversation } from '@/lib/types';
import { sendChatRequest } from '@/lib/openai';
import {
  loadConversations,
  saveConversations,
  saveConversation,
  deleteConversation as deleteConversationStorage,
} from '@/lib/storage';
import { generateConversationTitle } from '@/lib/utils';
import MessageList from './MessageList';
import PromptInput from './PromptInput';
import Loader from './Loader';
import ErrorBanner from './ErrorBanner';
import Sidebar from './Sidebar';

export default function ChatContainer() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load conversations from localStorage on mount for chat history
  useEffect(() => {
    const loaded = loadConversations();
    setConversations(loaded);
    
    // Set the most recent conversation as active if available
    if (loaded.length > 0) {
      const mostRecent = loaded.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      )[0];
      setActiveConversationId(mostRecent.id);
    }
  }, []);

  // Get active conversation
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  // Get messages from active conversation
  const messages = useMemo(() => {
    return activeConversation?.messages || [];
  }, [activeConversation]);

  // Create new conversation
  const handleNewChat = useCallback(() => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setError(null);
    setSidebarOpen(false); // Close sidebar on mobile after selecting
  }, []);

  // Switch to a different conversation
  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setError(null);
    setSidebarOpen(false); // Close sidebar on mobile after selecting
  }, []);

  // Update conversation title
  const handleUpdateTitle = useCallback((id: string, title: string) => {
    setConversations((prev) => {
      const updated = prev.map((conv) =>
        conv.id === id ? { ...conv, title, updatedAt: new Date() } : conv
      );
      saveConversations(updated);
      return updated;
    });
  }, []);

  // Delete conversation
  const handleDeleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((conv) => conv.id !== id);
      saveConversations(filtered);
      return filtered;
    });

    // switch to another if deleted conversation was active or create new
    if (id === activeConversationId) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id);
      } else {
        handleNewChat();
      }
    }
  }, [activeConversationId, conversations, handleNewChat]);

  // Handle message submission
  const handleSubmit = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || isLoading) return;

      // Ensure an active conversation
      let currentConversation = activeConversation;
      if (!currentConversation) {
        // Create a new conversation first
        const newConversation: Conversation = {
          id: `conv-${Date.now()}`,
          title: 'New Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setConversations((prev) => {
          const updated = [newConversation, ...prev];
          saveConversations(updated);
          return updated;
        });
        setActiveConversationId(newConversation.id);
        currentConversation = newConversation;
      }

      // Create user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: prompt,
        timestamp: new Date(),
      };

      // Update conversation with user message
      const updatedMessages = [...currentConversation.messages, userMessage];
      const updatedConversation: Conversation = {
        ...currentConversation,
        messages: updatedMessages,
        updatedAt: new Date(),
        // Update title if this is the first message
        title:
          currentConversation.messages.length === 0
            ? generateConversationTitle(prompt)
            : currentConversation.title,
      };

      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.id === currentConversation!.id ? updatedConversation : conv
        );
        saveConversations(updated);
        return updated;
      });

      setIsLoading(true);
      setError(null);

      try {
        // Prepare messages for API including conversation history
        const apiMessages = updatedMessages.map(({ role, content }) => ({
          role,
          content,
        }));

        // Send request to API
        const response = await sendChatRequest(apiMessages);

        // Create assistant message
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };

        // Update conversation with assistant message
        const finalMessages = [...updatedMessages, assistantMessage];
        const finalConversation: Conversation = {
          ...updatedConversation,
          messages: finalMessages,
          updatedAt: new Date(),
        };

        setConversations((prev) => {
          const updated = prev.map((conv) =>
            conv.id === currentConversation!.id ? finalConversation : conv
          );
          saveConversations(updated);
          return updated;
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, activeConversation, activeConversationId, conversations, handleNewChat]
  );

  const handleRetry = useCallback(() => {
    setError(null);
    // Retry last user message if it failed
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      handleSubmit(lastUserMessage.content);
    }
  }, [messages, handleSubmit]);

  const handleClearChat = useCallback(() => {
    if (!activeConversation) return;
    
    if (confirm('Are you sure you want to clear this conversation?')) {
      const clearedConversation: Conversation = {
        ...activeConversation,
        messages: [],
        updatedAt: new Date(),
      };

      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.id === activeConversation.id ? clearedConversation : conv
        );
        saveConversations(updated);
        return updated;
      });
      setError(null);
    }
  }, [activeConversation]);

  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950" role="application" aria-label="AI Chat Application">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onUpdateTitle={handleUpdateTitle}
        onDeleteConversation={handleDeleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle sidebar"
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              {activeConversation?.title || 'AI Chat'}
            </h1>
          </div>
          <button
            onClick={handleClearChat}
            disabled={!hasMessages || isLoading}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Clear chat history"
          >
            Clear Chat
          </button>
        </header>

        {/* Messages Area */}
        <main className="flex-1 flex flex-col overflow-hidden" role="log" aria-live="polite" aria-label="Chat messages">
          {error && (
            <div className="px-3 sm:px-4 pt-4">
              <ErrorBanner
                message={error}
                onRetry={handleRetry}
                onDismiss={() => setError(null)}
              />
            </div>
          )}
          <MessageList messages={messages} />
          {isLoading && <Loader />}
        </main>

        {/* Input Area */}
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-3 sm:py-4">
          <PromptInput onSubmit={handleSubmit} isLoading={isLoading} />
        </footer>
      </div>
    </div>
  );
}
