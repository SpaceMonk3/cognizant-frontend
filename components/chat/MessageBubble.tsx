import React from 'react';
import { Message } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // line breaks and format content
  const formatContent = (content: string) => {
    return content.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <article
      className={`flex items-end gap-2 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser ? 'justify-end pr-0 sm:pr-1' : 'justify-start pl-0 sm:pl-1'
      }`}
      role="article"
      aria-label={`${isUser ? 'User' : 'AI'} message`}
    >
      {!isUser && (
        <div
          className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold text-sm sm:text-base"
          aria-label="Bot avatar"
          role="img"
        >
          B
        </div>
      )}
      <div
        className={`max-w-[90%] sm:max-w-[85%] md:max-w-[75%] rounded-lg px-3 sm:px-4 py-2 sm:py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-900 rounded-bl-none'
        }`}
      >
        <div className="text-sm sm:text-base whitespace-pre-wrap break-words">
          {formatContent(message.content)}
        </div>
        <time
          className={`text-xs mt-2 block ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}
          dateTime={message.timestamp.toISOString()}
          aria-label={`Sent at ${new Date(message.timestamp).toLocaleTimeString()}`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </div>
      {isUser && (
        <div
          className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm sm:text-base"
          aria-label="User avatar"
          role="img"
        >
          U
        </div>
      )}
    </article>
  );
}
