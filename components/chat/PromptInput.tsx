'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function PromptInput({ onSubmit, isLoading, disabled }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate and adjust textarea height dynamically
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to get accurate scrollHeight
    textarea.style.height = '0px';
    
    // Get computed styles
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 8;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 8;
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 1;
    const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 1;
    
    const totalPadding = paddingTop + paddingBottom;
    const totalBorder = borderTop + borderBottom;
    const minHeight = lineHeight + totalPadding + totalBorder; // One line height
    const maxHeight = lineHeight * 5 + totalPadding + totalBorder; // Five lines max

    // Get scrollHeight after reset
    const scrollHeight = textarea.scrollHeight;
    
    // For empty content minHeight one line
    // For content scrollHeight but between min and max
    const newHeight = prompt.trim() === '' 
      ? minHeight 
      : Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    
    textarea.style.height = `${newHeight}px`;
    
    // Enable scrolling if content exceeds max height
    if (scrollHeight > maxHeight) {
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }
  };

  // Set initial height on mount
  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  // Adjust height when prompt changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [prompt]);

  // Adjust height on window resize
  useEffect(() => {
    const handleResize = () => {
      adjustTextareaHeight();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = () => {
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt && !isLoading && !disabled) {
      onSubmit(trimmedPrompt);
      setPrompt('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isSubmitDisabled = !prompt.trim() || isLoading || disabled;

  return (
    <div className="flex flex-col space-y-2 sm:space-y-3">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          disabled={isLoading || disabled}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-12 sm:pr-14 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none text-sm sm:text-base text-gray-900 bg-white placeholder:text-gray-400 leading-normal overflow-hidden"
          style={{ minHeight: 'auto', maxHeight: 'none', height: 'auto' }}
          aria-label="Chat input"
          aria-describedby="input-help"
          aria-required="true"
          aria-invalid={false}
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0"
          aria-label="Send message"
          type="button"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </div>
      <p id="input-help" className="text-xs text-gray-500 px-1">
        Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
