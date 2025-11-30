import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from '../context/ChatContext';
import { Send } from 'lucide-react';
import { Button } from './ui/button';

const ChatInput = () => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const { sendMessage, isLoading } = useChatContext();

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
                placeholder="Nachricht eingeben..."
                rows={1}
                className="flex-1 bg-transparent text-white text-base resize-none outline-none placeholder-gray-500 max-h-[200px] leading-6"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!message.trim() || isLoading}
                className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ml-2
                  ${message.trim() && !isLoading
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-[#3f3f3f] text-gray-500 cursor-not-allowed'
                  }`}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </form>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-500 mt-3">
          Baumate kann Fehler machen. Überprüfe wichtige Informationen.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
