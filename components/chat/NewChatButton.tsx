'use client';

import React from 'react';
import Button from '../ui/Button';

interface NewChatButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function NewChatButton({ onClick, disabled }: NewChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="primary"
      className="w-full flex items-center justify-center"
      aria-label="Start new conversation"
    >
      <svg
        className="w-5 h-5 mr-2 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      <span>New Chat</span>
    </Button>
  );
}
