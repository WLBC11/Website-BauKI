import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useChatContext } from '../context/ChatContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ScrollArea } from './ui/scroll-area';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';

const GREETINGS = [
  "Wie kann ich dir helfen?",
  "Was steht heute an?",
  "Wobei kann ich dich unterstützen?",
  "Hast du Fragen zu einem Bauprojekt?",
  "Lass uns etwas Neues planen!",
  "Wie kann ich dir heute behilflich sein?",
  "Was möchtest du wissen?",
  "Bereit für deine Fragen!",
  "Welches Bauvorhaben gehen wir heute an?"
];

const ChatArea = () => {
  const { activeConversation, isLoading, sidebarOpen, toggleSidebar } = useChatContext();
  const messagesEndRef = useRef(null);
  
  // Random greeting logic: stable across renders until conversation changes (which resets view)
  // We use useMemo with an empty dependency array to generate it once per mount of the "Empty State" view
  // effectively. Or we can just pick one. Since ChatArea doesn't unmount, we need a trigger.
  // Actually, when activeConversation is null, we want a random one.
  const randomGreeting = useMemo(() => {
    return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  }, [activeConversation]); // Re-roll when conversation state changes (e.g. back to null)


  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, isLoading]);

  // Empty state - new conversation
  if (!activeConversation) {
    return (
      <div className="flex flex-col h-full bg-[#212121]">
        {/* Header with menu button when sidebar closed */}
        {!sidebarOpen && (
          <div className="absolute top-0 left-0 z-0 p-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-lg flex items-center justify-center"
            >
              <Menu className="h-5 w-5 mx-auto" />
            </Button>
          </div>
        )}
        
        {/* Centered content - Mobile optimized */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-white mb-6 md:mb-10 text-center animate-in fade-in zoom-in duration-500">
            {randomGreeting}
          </h1>
        </div>
        
        {/* Input at bottom */}
        <ChatInput />
      </div>
    );
  }

  // Conversation view
  return (
    <div className="flex flex-col h-full bg-[#212121]">
      {/* Header with menu button when sidebar closed */}
      {!sidebarOpen && (
        <div className="absolute top-0 left-0 z-0 p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-lg flex items-center justify-center"
          >
            <Menu className="h-5 w-5 mx-auto" />
          </Button>
        </div>
      )}

      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div className="pb-64">
          {activeConversation.messages.map((message, index) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              isLast={index === activeConversation.messages.length - 1}
            />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="py-6">
              <div className="max-w-3xl mx-auto px-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-[#3a3a3a] flex items-center justify-center overflow-hidden p-1.5">
                      <img 
                        src="/baumate-logo.png" 
                        alt="BauKI" 
                        className="h-full w-full object-contain"
                        style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area - fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-6">
        <ChatInput />
      </div>
    </div>
  );
};

export default ChatArea;