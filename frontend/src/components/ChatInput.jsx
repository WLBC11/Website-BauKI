import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from '../context/ChatContext';
import { Send, Paperclip, Mic, Globe, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const ChatInput = () => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const { sendMessage, isLoading, selectedModel, setSelectedModel, models } = useChatContext();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      sendMessage(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="relative bg-[#2f2f2f] rounded-2xl border border-[#3f3f3f] focus-within:border-[#5f5f5f] transition-colors">
            {/* Input area */}
            <div className="flex items-end p-3">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message ChatGPT"
                rows={1}
                className="flex-1 bg-transparent text-white text-base resize-none outline-none placeholder-gray-500 max-h-[200px] leading-6"
                disabled={isLoading}
              />
            </div>

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#3f3f3f] rounded-lg"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-3 text-gray-400 hover:text-white hover:bg-[#3f3f3f] rounded-lg flex items-center gap-1"
                    >
                      <Globe className="h-4 w-4" />
                      <span className="text-sm">Search</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#2f2f2f] border-[#3f3f3f]">
                    <DropdownMenuItem className="text-gray-200 cursor-pointer">
                      Web Search
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-gray-200 cursor-pointer">
                      Academic Search
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-3 text-gray-400 hover:text-white hover:bg-[#3f3f3f] rounded-lg flex items-center gap-1"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm">Reason</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#2f2f2f] border-[#3f3f3f]">
                    <DropdownMenuItem className="text-gray-200 cursor-pointer">
                      Standard
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-gray-200 cursor-pointer">
                      Deep Thinking
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#3f3f3f] rounded-lg"
                >
                  <Mic className="h-5 w-5" />
                </Button>
                <Button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors
                    ${message.trim() && !isLoading
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-[#3f3f3f] text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-500 mt-3">
          ChatGPT can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
