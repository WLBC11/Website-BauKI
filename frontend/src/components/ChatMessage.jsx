import React, { useState } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatMessage = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const isUser = message.role === 'user';

  // Get user initial
  const getUserInitial = () => {
    if (user?.name) return user.name[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'G'; // Guest
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`py-6 ${isUser ? '' : 'bg-transparent'}`}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isUser ? (
              <div className="h-8 w-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-white text-sm font-medium">
                {getUserInitial()}
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-[#3a3a3a] flex items-center justify-center overflow-hidden p-1.5">
                <img 
                  src="/baumate-logo.png" 
                  alt="BauKI" 
                  className="h-full w-full object-contain"
                  style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
                />
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            {isUser && (
              <div className="font-semibold text-gray-200 mb-1">Du</div>
            )}
            <div className={`text-gray-200 leading-relaxed ${!isUser ? 'mt-1' : ''}`}>
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none 
                  prose-headings:text-gray-100 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                  prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                  prose-p:text-gray-200 prose-p:my-2 prose-p:leading-relaxed
                  prose-strong:text-white prose-strong:font-semibold
                  prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4
                  prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4
                  prose-li:text-gray-200 prose-li:my-1
                  prose-code:text-pink-400 prose-code:bg-[#3f3f3f] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-[#1e1e1e] prose-pre:p-0 prose-pre:my-4 prose-pre:rounded-lg prose-pre:overflow-hidden
                  prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      pre: ({ children }) => (
                        <pre className="bg-[#1e1e1e] rounded-lg overflow-hidden my-4">
                          {children}
                        </pre>
                      ),
                      code: ({ node, inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        
                        if (!inline) {
                          return (
                            <div>
                              <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-xs text-gray-400">
                                <span>{language || 'code'}</span>
                                <button
                                  onClick={() => navigator.clipboard.writeText(String(children))}
                                  className="flex items-center gap-1 hover:text-white transition-colors"
                                >
                                  <Copy className="h-3 w-3" />
                                  Code kopieren
                                </button>
                              </div>
                              <code className="block p-4 overflow-x-auto text-sm text-gray-300" {...props}>
                                {children}
                              </code>
                            </div>
                          );
                        }
                        return (
                          <code className="text-pink-400 bg-[#3f3f3f] px-1.5 py-0.5 rounded text-sm" {...props}>
                            {children}
                          </code>
                        );
                      },
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full border-collapse border border-[#3f3f3f]">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="border border-[#3f3f3f] px-4 py-2 bg-[#2f2f2f] text-left font-semibold">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-[#3f3f3f] px-4 py-2">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
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
