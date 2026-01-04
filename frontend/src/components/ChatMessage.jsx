import React, { useState, useEffect } from 'react';
import { Copy, Check, FileText, Image as ImageIcon, Mic, X, ZoomIn, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// File Preview Modal Component
const FilePreviewModal = ({ file, isOpen, onClose }) => {
  if (!isOpen || !file) return null;

  const isImage = file.fileType === 'image' || file.type?.startsWith('image/');
  const isPdf = file.fileType === 'pdf' || file.type === 'application/pdf';

  // Get the data URL for display
  const getDataUrl = () => {
    if (file.preview) return file.preview;
    if (file.data) {
      const mimeType = file.type || (isImage ? 'image/png' : 'application/pdf');
      return `data:${mimeType};base64,${file.data}`;
    }
    return null;
  };

  const dataUrl = getDataUrl();

  // Handle click outside to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Open PDF in new tab
  const openInNewTab = () => {
    if (dataUrl) {
      window.open(dataUrl, '_blank');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-[90vw] max-h-[90vh] bg-[#1f1f1f] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#2f2f2f] border-b border-[#3f3f3f]">
          <div className="flex items-center gap-3 min-w-0">
            {isImage ? (
              <ImageIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
            ) : (
              <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className="text-sm text-gray-200 truncate max-w-[300px]">{file.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {isPdf && dataUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={openInNewTab}
                className="text-gray-400 hover:text-white hover:bg-[#3f3f3f]"
                title="In neuem Tab öffnen"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Öffnen
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#3f3f3f]"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[calc(90vh-60px)] overflow-auto">
          {isImage && dataUrl ? (
            <img 
              src={dataUrl} 
              alt={file.name}
              className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg"
            />
          ) : isPdf && dataUrl ? (
            <div className="flex flex-col items-center gap-4">
              <iframe
                src={dataUrl}
                title={file.name}
                className="w-full h-[70vh] min-w-[600px] rounded-lg border border-[#3f3f3f]"
              />
              <p className="text-sm text-gray-400">
                PDF wird nicht angezeigt? 
                <button 
                  onClick={openInNewTab}
                  className="ml-2 text-blue-400 hover:underline"
                >
                  In neuem Tab öffnen
                </button>
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p>Vorschau nicht verfügbar</p>
              <p className="text-sm mt-2">Datei: {file.name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Define components outside to avoid re-renders
// No box styling - everything displays as normal text
const PreBlock = ({ children }) => (
  <span className="whitespace-pre-wrap">
    {children}
  </span>
);

const CodeBlock = ({ node, inline, className, children, ...props }) => {
  // ChatGPT-style: EVERYTHING is displayed as normal text - no code boxes ever
  // All numbers, formulas, code, everything appears as regular text
  if (!inline) {
    return (
      <span className="text-gray-200 whitespace-pre-wrap" {...props}>
        {children}
      </span>
    );
  }
  
  // ChatGPT-style: Inline code appears as normal text, no special formatting
  // This makes numbers and short inline code blend naturally with the text
  return (
    <span className="text-gray-200" {...props}>
      {children}
    </span>
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

// File attachment display component - clickable to open preview
const FileAttachment = ({ file, compact = false, onClick }) => {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage = file.fileType === 'image' || file.type?.startsWith('image/');
  const isAudio = file.fileType === 'audio' || file.type?.startsWith('audio/');
  const canPreview = isImage || file.fileType === 'pdf' || file.type === 'application/pdf';

  // For audio files, show a different indicator (not clickable for preview)
  if (isAudio) {
    return (
      <div className={compact ? '' : 'mt-2 mb-3'}>
        <div className={`inline-flex items-center gap-2 p-2 bg-[#3f3f3f] rounded-lg ${compact ? 'max-w-[150px]' : ''}`}>
          <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0`}>
            <Mic className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
          </div>
          <div className="min-w-0">
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-200`}>Sprachnachricht</p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'mt-2 mb-3'}>
      <button
        onClick={canPreview ? onClick : undefined}
        className={`inline-flex items-center gap-2 p-2 bg-[#3f3f3f] rounded-lg transition-all duration-200 text-left
          ${compact ? 'max-w-[150px]' : 'max-w-sm gap-3 p-3'}
          ${canPreview ? 'hover:bg-[#4f4f4f] hover:scale-[1.02] cursor-pointer group' : ''}`}
        title={canPreview ? 'Klicken zum Anzeigen' : file.name}
      >
        {/* Preview or Icon */}
        <div className="relative">
          {file.preview ? (
            <img 
              src={file.preview} 
              alt={file.name} 
              className={`${compact ? 'w-10 h-10' : 'w-16 h-16'} object-cover rounded-md`}
            />
          ) : (
            <div className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} bg-[#4f4f4f] rounded-md flex items-center justify-center flex-shrink-0`}>
              {isImage ? (
                <ImageIcon className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-blue-400`} />
              ) : (
                <FileText className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-red-400`} />
              )}
            </div>
          )}
          {/* Zoom icon overlay on hover */}
          {canPreview && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
            </div>
          )}
        </div>
        
        {/* File Info */}
        <div className="min-w-0">
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-200 truncate ${compact ? 'max-w-[80px]' : 'max-w-[200px]'}`}>{file.name}</p>
          <p className="text-xs text-gray-500">
            {isImage ? 'Bild' : 'PDF'} • {formatFileSize(file.size)}
          </p>
        </div>
      </button>
    </div>
  );
};

const ChatMessage = ({ message, isLast }) => {
  const [copied, setCopied] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const { user } = useAuth();
  const { isTyping, setIsTyping } = useChatContext();
  const isUser = message.role === 'user';
  
  // Streaming effect state
  const [displayedContent, setDisplayedContent] = useState(
    message.shouldAnimate ? '' : message.content
  );

  // Typewriter effect logic
  useEffect(() => {
    if (!message.shouldAnimate) {
      setDisplayedContent(message.content);
      return;
    }
    
    // If global typing state is false but we haven't finished, snap to end
    if (!isTyping && displayedContent.length < message.content.length) {
         setDisplayedContent(message.content);
         return;
    }

    if (displayedContent === message.content) {
        // If we finished naturally, tell context we are done
        // Only if WE are the last message (prevent old messages from stopping typing)
        if (isTyping && isLast) {
            setIsTyping(false);
        }
        return;
    }

    // Use a faster interval for better feel (10ms)
    // Add multiple characters at once for long messages to speed up
    const interval = setInterval(() => {
      setDisplayedContent(current => {
        if (!isTyping) { // Double check inside interval
            clearInterval(interval);
            return message.content;
        }

        if (current.length >= message.content.length) {
          clearInterval(interval);
          if (isLast) setIsTyping(false); // Ensure we turn it off here too
          return current;
        }
        
        // Calculate chunk size based on remaining length to keep it responsive
        const remaining = message.content.length - current.length;
        const chunkSize = Math.max(1, Math.min(5, Math.ceil(remaining / 50)));
        
        return message.content.slice(0, current.length + chunkSize);
      });
    }, 15);

    return () => clearInterval(interval);
  }, [message.content, message.shouldAnimate, isTyping]); // Intentionally removed displayedContent to avoid re-run on every char

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
    <div className={`py-4 md:py-6 ${isUser ? '' : 'bg-transparent'}`}>
      <div className="max-w-3xl mx-auto px-3 md:px-4">
        <div className="flex gap-3 md:gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isUser ? (
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-[#3b82f6] flex items-center justify-center text-white text-xs md:text-sm font-medium">
                {getUserInitial()}
              </div>
            ) : (
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-[#3a3a3a] flex items-center justify-center overflow-hidden p-1.5">
                <img 
                  src="/baumate-logo.png?v=2" 
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
                <>
                  {/* Show file attachments if present (support both single file and multiple files) */}
                  {message.files && message.files.length > 0 && (
                    <div className={`flex flex-wrap gap-2 ${message.files.length > 1 ? 'mb-3' : ''}`}>
                      {message.files.map((file, index) => (
                        <FileAttachment 
                          key={`${file.name}-${index}`} 
                          file={file} 
                          compact={message.files.length > 1}
                          onClick={() => setPreviewFile(file)}
                        />
                      ))}
                    </div>
                  )}
                  {/* Backwards compatibility for single file */}
                  {message.file && !message.files && (
                    <FileAttachment 
                      file={message.file}
                      onClick={() => setPreviewFile(message.file)}
                    />
                  )}
                  {/* Only show text if there is content */}
                  {message.content && (
                    <p className="whitespace-pre-wrap break-words text-base">{message.content}</p>
                  )}
                </>
              ) : (
                <div className="markdown-body prose prose-invert prose-base max-w-none 
                  prose-headings:text-white prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
                  prose-p:text-gray-200 prose-p:my-3 prose-p:leading-7
                  prose-strong:text-white prose-strong:font-semibold
                  prose-h1:text-xl prose-h1:mb-4
                  prose-h2:text-lg prose-h2:mb-3
                  prose-h3:text-base prose-h3:mb-2
                  prose-h4:text-base prose-h4:mb-2
                  prose-ul:my-3 prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-1
                  prose-ol:my-3 prose-ol:list-decimal prose-ol:pl-5 prose-ol:space-y-1
                  prose-li:text-gray-200 prose-li:my-1 prose-li:leading-7
                  prose-blockquote:border-l-4 prose-blockquote:border-gray-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-300 prose-blockquote:my-4
                  prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                  ">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      pre: PreBlock,
                      code: CodeBlock,
                      table: TableBlock,
                      th: ThBlock,
                      td: TdBlock
                    }}
                  >
                    {displayedContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Action buttons for AI messages - only show when finished typing */}
            {!isUser && (!message.shouldAnimate || displayedContent.length === message.content.length) && (
              <div className="flex items-center gap-1 mt-3 animate-in fade-in duration-500">
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

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};

export default ChatMessage;