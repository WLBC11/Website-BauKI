import React, { useRef, useEffect } from 'react';
import { useChatContext } from '../context/ChatContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ScrollArea } from './ui/scroll-area';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';

const ChatArea = () => {
  const { activeConversation, isLoading, sidebarOpen, toggleSidebar } = useChatContext();
  const messagesEndRef = useRef(null);

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
          <div className="absolute top-0 left-0 z-10 p-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        )}
        
        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <h1 className="text-3xl font-semibold text-white mb-10">Wie kann ich dir helfen?</h1>
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
        <div className="absolute top-0 left-0 z-10 p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div className="pb-32">
          {activeConversation.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="py-6">
              <div className="max-w-3xl mx-auto px-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-[#2f2f2f] flex items-center justify-center overflow-hidden">
                      <img 
                        src="https://customer-assets.emergentagent.com/job_ai-chat-clone-77/artifacts/qplempyx_BauKI-Logo-Transparent.png" 
                        alt="Baumate" 
                        className="h-6 w-6 object-contain brightness-0 invert"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-200 mb-2">Baumate</div>
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
