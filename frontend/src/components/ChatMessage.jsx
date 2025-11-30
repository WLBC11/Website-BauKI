import React, { useState } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

const ChatMessage = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple markdown-like rendering
  const renderContent = (content) => {
    // Split by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        // Code block
        const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
        const language = match?.[1] || '';
        const code = match?.[2] || part.slice(3, -3);
        return (
          <div key={index} className="my-4 rounded-lg overflow-hidden bg-[#1e1e1e]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-xs text-gray-400">
              <span>{language || 'code'}</span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <Copy className="h-3 w-3" />
                Code kopieren
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code className="text-gray-300">{code}</code>
            </pre>
          </div>
        );
      } else {
        // Regular text with inline formatting
        return (
          <div key={index} className="whitespace-pre-wrap">
            {renderInlineFormatting(part)}
          </div>
        );
      }
    });
  };

  const renderInlineFormatting = (text) => {
    // Split by inline code
    const parts = text.split(/(`[^`]+`)/g);

    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="bg-[#3f3f3f] px-1.5 py-0.5 rounded text-sm text-pink-400">
            {part.slice(1, -1)}
          </code>
        );
      }

      // Handle bold text
      let formatted = part;
      const boldParts = formatted.split(/(\*\*[^*]+\*\*)/g);

      return boldParts.map((boldPart, boldIndex) => {
        if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
          return (
            <strong key={`${index}-${boldIndex}`} className="font-semibold">
              {boldPart.slice(2, -2)}
            </strong>
          );
        }

        // Handle headers
        const lines = boldPart.split('\n');
        return lines.map((line, lineIndex) => {
          if (line.startsWith('## ')) {
            return (
              <h2 key={`${index}-${boldIndex}-${lineIndex}`} className="text-lg font-semibold mt-4 mb-2">
                {line.slice(3)}
              </h2>
            );
          }
          if (line.startsWith('# ')) {
            return (
              <h1 key={`${index}-${boldIndex}-${lineIndex}`} className="text-xl font-bold mt-4 mb-2">
                {line.slice(2)}
              </h1>
            );
          }
          if (line.startsWith('- ')) {
            return (
              <div key={`${index}-${boldIndex}-${lineIndex}`} className="flex items-start gap-2 ml-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{line.slice(2)}</span>
              </div>
            );
          }
          return lineIndex < lines.length - 1 ? (
            <React.Fragment key={`${index}-${boldIndex}-${lineIndex}`}>
              {line}
              <br />
            </React.Fragment>
          ) : (
            <React.Fragment key={`${index}-${boldIndex}-${lineIndex}`}>{line}</React.Fragment>
          );
        });
      });
    });
  };

  return (
    <div className={`py-6 ${isUser ? '' : 'bg-transparent'}`}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isUser ? (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#3a3a3a] flex items-center justify-center overflow-hidden p-1.5">
                <img 
                  src="/baumate-logo.png" 
                  alt="Baumate" 
                  className="h-full w-full object-contain invert brightness-200"
                />
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-200 mb-1">
              {isUser ? 'Du' : 'Baumate'}
            </div>
            <div className="text-gray-200 leading-relaxed">
              {renderContent(message.content)}
            </div>

            {/* Action buttons for AI messages */}
            {!isUser && (
              <div className="flex items-center gap-1 mt-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-500 hover:text-gray-200 hover:bg-[#2f2f2f]"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-500 hover:text-gray-200 hover:bg-[#2f2f2f]"
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-500 hover:text-gray-200 hover:bg-[#2f2f2f]"
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-500 hover:text-gray-200 hover:bg-[#2f2f2f]"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
