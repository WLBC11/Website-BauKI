import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Define components outside to avoid re-renders
const PreBlock = ({ children }) => (
  <pre className="bg-[#0d0d0d] rounded-md overflow-hidden my-4 border border-gray-800">
    {children}
  </pre>
);

const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
     navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
  };

  if (!inline) {
    return (
      <div className="relative group">
        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-xs text-gray-400 rounded-t-md">
          <span>{language || 'code'}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Kopiert!' : 'Code kopieren'}
          </button>
        </div>
        <code className="block p-4 overflow-x-auto text-base text-gray-300 font-mono bg-black/50" {...props}>
          {children}
        </code>
      </div>
    );
  }
  return (
    <code className="text-pink-400 bg-[#3f3f3f] px-1.5 py-0.5 rounded text-base font-mono" {...props}>
      {children}
    </code>
  );
};

const TableBlock = ({ children }) => (
  <div className="overflow-x-auto my-4 border border-gray-700 rounded-md">
    <table className="min-w-full border-collapse text-sm">
      {children}
    </table>
  </div>
);

const ThBlock = ({ children }) => (
  <th className="border-b border-gray-700 px-4 py-2 bg-[#2f2f2f] text-left font-semibold text-gray-200">
    {children}
  </th>
);

const TdBlock = ({ children }) => (
  <td className="border-b border-gray-800 px-4 py-2 text-gray-300">
    {children}
  </td>
);

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
          <div className="flex-1 min-w-0 overflow-hidden">
            {isUser && (
              <div className="font-semibold text-gray-200 mb-1">Du</div>
            )}
            <div className={`text-gray-200 leading-relaxed ${!isUser ? 'mt-1' : ''}`}>
              {isUser ? (
                <p className="whitespace-pre-wrap break-words text-base">{message.content}</p>
              ) : (
                <div className="markdown-body prose prose-invert prose-base max-w-none 
                  prose-headings:text-gray-100 prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
                  prose-p:text-gray-300 prose-p:my-3 prose-p:leading-7
                  prose-strong:text-white prose-strong:font-bold
                  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                  prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                  prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                  prose-li:text-gray-300 prose-li:my-1
                  prose-blockquote:border-l-4 prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-400
                  prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                  ">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      pre: PreBlock,
                      code: CodeBlock,
                      table: TableBlock,
                      th: ThBlock,
                      td: TdBlock
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;