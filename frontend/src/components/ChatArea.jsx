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

  const suggestions = [
    {
      title: 'Hilf mir beim Schreiben',
      subtitle: 'eines Textes oder kreativen Stücks'
    },
    {
      title: 'Programmieren',
      subtitle: 'ein Python-Skript oder debuggen'
    },
    {
      title: 'Ratschläge geben',
      subtitle: 'zu einer persönlichen Angelegenheit'
    },
    {
      title: 'Zusammenfassen',
      subtitle: 'eines langen Artikels oder Dokuments'
    }
  ];

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
                    <div className="h-8 w-8 rounded-full bg-[#19c37d] flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.500197C16.1708 0.495044 14.0893 1.16803 12.3614 2.42214C10.6335 3.67624 9.34853 5.44666 8.6917 7.47815C7.30085 7.76286 5.98686 8.3414 4.8377 9.17505C3.68854 10.0087 2.73073 11.0782 2.02839 12.312C0.956464 14.1591 0.504623 16.2718 0.720365 18.3404C0.936107 20.409 1.82788 22.3334 3.30126 23.8402C2.85281 25.1868 2.69729 26.6136 2.84498 28.0251C2.99267 29.4366 3.44014 30.8002 4.15755 32.0247C5.22086 33.8769 6.84526 35.3433 8.79618 36.2124C10.7471 37.0815 12.9237 37.3083 15.012 36.8601C15.954 37.9216 17.1117 38.7697 18.408 39.3475C19.7042 39.9254 21.1088 40.2197 22.528 40.2107C24.6629 40.2159 26.7444 39.5429 28.4723 38.2888C30.2002 37.0347 31.4852 35.2643 32.1421 33.2328C33.533 32.9481 34.8469 32.3696 35.996 31.5359C37.1452 30.7023 38.103 29.6327 38.8054 28.3989C39.8774 26.5519 40.2391 24.4391 39.9099 22.3705C39.5807 20.3019 38.6889 18.3776 37.2155 16.8707H37.5324Z" fill="white"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-200 mb-2">KI-Assistent</div>
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
