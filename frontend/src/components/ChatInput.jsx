import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from '../context/ChatContext';
import { Send, X, Square } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';

const AVAILABLE_DATABASES = [
  "Brandschutz", 
  "Straßenbau", 
  "TGA", 
  "Energieberatung", 
  "Beton"
];

const ChatInput = () => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const { sendMessage, isLoading, activeDatabases, setActiveDatabases, stopGeneration, isTyping } = useChatContext();

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

  const toggleDatabase = (db) => {
    setActiveDatabases(prev => 
      prev.includes(db) 
        ? prev.filter(d => d !== db)
        : [...prev, db]
    );
  };

  const removeDatabase = (db) => {
    setActiveDatabases(prev => prev.filter(d => d !== db));
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        
        {/* Active Database Tags */}
        {activeDatabases.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2">
            {activeDatabases.map(db => (
              <Badge 
                key={db} 
                variant="secondary"
                className="bg-[#3f3f3f] hover:bg-[#4f4f4f] text-gray-200 cursor-pointer pl-2 pr-1 py-1 flex items-center gap-1 transition-colors border border-transparent hover:border-gray-500"
                onClick={() => removeDatabase(db)}
              >
                {db}
                <X className="h-3 w-3 text-gray-400 hover:text-white" />
              </Badge>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="relative bg-[#2f2f2f] rounded-2xl border border-[#3f3f3f] focus-within:border-[#5f5f5f] transition-colors">
            {/* Input area */}
            <div className="flex flex-col">
              <div className="flex items-start px-4 pt-3 pb-2 gap-2">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nachricht eingeben..."
                  rows={1}
                  className="flex-1 bg-transparent text-white text-base resize-none outline-none placeholder-gray-500 max-h-[200px] overflow-y-auto py-1"
                  style={{ lineHeight: '1.5' }}
                  disabled={isLoading}
                />
              </div>
              
              {/* Bottom toolbar */}
              <div className="flex items-center justify-between px-3 pb-3 pt-1">
                <div className="flex items-center gap-1">
                  {/* Database Selector Button */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 rounded-full flex-shrink-0 transition-colors ${activeDatabases.length > 0 ? 'bg-[#4f4f4f] hover:bg-[#5f5f5f]' : 'bg-[#3f3f3f] hover:bg-[#4f4f4f]'}`}
                        type="button"
                      >
                        <img 
                          src="/law-book.png" 
                          alt="Databases" 
                          className={`h-5 w-5 object-contain transition-all duration-200 ${activeDatabases.length > 0 ? 'opacity-100' : 'opacity-70 hover:opacity-100'} invert mix-blend-screen`}
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-[#2f2f2f] border-[#3f3f3f] text-gray-200">
                      <DropdownMenuLabel>Themen wählen</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-[#3f3f3f]" />
                      {AVAILABLE_DATABASES.map(db => (
                        <DropdownMenuCheckboxItem
                          key={db}
                          checked={activeDatabases.includes(db)}
                          onCheckedChange={() => toggleDatabase(db)}
                          className="focus:bg-[#3f3f3f] focus:text-white cursor-pointer"
                        >
                          {db}
                        </DropdownMenuCheckboxItem>
                      ))}
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