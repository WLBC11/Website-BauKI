import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from '../context/ChatContext';
import { Send, Square } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';

const AVAILABLE_DATABASES = [
  "BauGB (Baugesetzbuch)", 
  "BauNVO (Baunutzungsverordnung)", 
  "VOB A (Vergabe- und Vertragsordnung für Bauleistungen, Teil A)", 
  "VOB B (Vergabe- und Vertragsordnung für Bauleistungen, Teil B)", 
  "VOB C (Vergabe- und Vertragsordnung für Bauleistungen, Teil C)",
  "MBO (Musterbauordnung - Brandschutz)",
  "BPD BTA",
  "VollzBekLBO",
  "VV TB SH",
  "Alle 16 Landesbauordnungen (LBOs)"
];

const ChatInput = () => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const { sendMessage, isLoading, stopGeneration, isTyping } = useChatContext();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '52px'; // Reset to minimum height
      const scrollHeight = textareaRef.current.scrollHeight;
      // Max height of 200px (approx 8 lines)
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isLoading || isTyping) {
        stopGeneration();
        return;
    }

    if (message.trim() && !isLoading) {
      sendMessage(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '52px';
        // Keep focus on textarea after sending
        textareaRef.current.focus();
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
    <div className="px-3 md:px-4 pb-3 md:pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="relative bg-[#2f2f2f] rounded-2xl border border-[#3f3f3f] focus-within:border-[#5f5f5f] transition-colors">
            {/* Input area */}
            <div className="flex flex-col">
              <div className="flex items-start px-3 md:px-4 pt-3 pb-2 gap-2">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nachricht eingeben..."
                  rows={1}
                  className="flex-1 bg-transparent text-white text-sm md:text-base resize-none outline-none placeholder-gray-500 max-h-[200px] overflow-y-auto py-1"
                  style={{ lineHeight: '1.5' }}
                  disabled={isLoading}
                />
              </div>
              
              {/* Bottom toolbar */}
              <div className="flex items-center justify-between px-3 pb-3 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Database Info Button */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full flex-shrink-0 transition-colors bg-[#3f3f3f] hover:bg-[#4f4f4f]"
                        type="button"
                      >
                        <img 
                          src="/law-book.png" 
                          alt="Integrierte Datenbanken" 
                          className="h-5 w-5 object-contain transition-all duration-200 opacity-70 hover:opacity-100 invert mix-blend-screen"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[500px] bg-[#2f2f2f] border-[#3f3f3f] text-gray-200">
                      <DropdownMenuLabel className="text-sm font-semibold">Integrierte Datenbanken</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-[#3f3f3f]" />
                      <div className="px-2 py-2 space-y-1 max-h-[400px] overflow-y-auto">
                        {AVAILABLE_DATABASES.map((db, index) => (
                          <div 
                            key={index} 
                            className="px-2 py-2 rounded-md text-sm text-gray-300 hover:bg-[#3f3f3f] transition-colors"
                          >
                            {db}
                          </div>
                        ))}
                      </div>
                      <DropdownMenuSeparator className="bg-[#3f3f3f]" />
                      <div className="px-3 py-2 text-xs text-gray-500">
                        Die KI hat automatisch Zugriff auf alle Themen
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Send Button */}
                <Button
                  type="submit"
                  disabled={(!message.trim() && !isLoading && !isTyping)}
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0
                    ${isLoading || isTyping 
                      ? 'bg-white text-black hover:bg-gray-200' 
                      : message.trim() 
                          ? 'bg-white text-black hover:bg-gray-200'
                          : 'bg-[#3f3f3f] text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {isLoading || isTyping ? (
                      <Square className="h-4 w-4 fill-black" />
                  ) : (
                      <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-500 mt-3">
          Die BauKI kann Fehler machen. Bitte überprüfen Sie wichtige Informationen.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;