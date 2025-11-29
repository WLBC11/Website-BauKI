import React, { createContext, useContext, useState, useCallback } from 'react';
import { mockConversations, models } from '../data/mockData';

const ChatContext = createContext();

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const createNewConversation = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  const selectConversation = useCallback((id) => {
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback((id) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  }, [activeConversationId]);

  const sendMessage = useCallback(async (content) => {
    if (!content.trim()) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    let conversationId = activeConversationId;

    if (!conversationId) {
      // Create new conversation
      conversationId = `conv-${Date.now()}`;
      const newConversation = {
        id: conversationId,
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        messages: [userMessage],
        createdAt: new Date()
      };
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(conversationId);
    } else {
      // Add to existing conversation
      setConversations(prev => prev.map(c => 
        c.id === conversationId 
          ? { ...c, messages: [...c.messages, userMessage] }
          : c
      ));
    }

    // Simulate AI response
    setIsLoading(true);
    
    // Mock delay for AI response
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

    const aiMessage = {
      id: `msg-${Date.now()}-ai`,
      role: 'assistant',
      content: generateMockResponse(content),
      timestamp: new Date()
    };

    setConversations(prev => prev.map(c => 
      c.id === conversationId 
        ? { ...c, messages: [...c.messages, aiMessage] }
        : c
    ));

    setIsLoading(false);
  }, [activeConversationId]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const value = {
    conversations,
    activeConversation,
    activeConversationId,
    selectedModel,
    setSelectedModel,
    isLoading,
    sidebarOpen,
    createNewConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    toggleSidebar,
    models
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Mock response generator
function generateMockResponse(userMessage) {
  const responses = [
    `That's a great question! Let me help you with that.\n\nBased on your query about "${userMessage.slice(0, 50)}...", here are some key points:\n\n1. **Understanding the basics** - It's important to start with foundational concepts\n2. **Practical application** - Theory alone isn't enough\n3. **Continuous learning** - Technology evolves rapidly\n\nWould you like me to elaborate on any of these points?`,
    `I'd be happy to help you with that!\n\nHere's a comprehensive answer:\n\n\`\`\`javascript\n// Example code\nconst solution = () => {\n  console.log('Hello, World!');\n  return 'Success';\n};\n\`\`\`\n\nThis approach is commonly used because it provides:\n- Clean syntax\n- Easy maintenance\n- Better readability\n\nLet me know if you need more details!`,
    `Excellent question! Here's what you need to know:\n\n## Overview\nThis topic involves several important concepts that work together.\n\n## Key Concepts\n- **Concept 1**: Foundation of the approach\n- **Concept 2**: Building blocks for implementation\n- **Concept 3**: Best practices to follow\n\n## Example\n\`\`\`python\ndef example_function():\n    return "This is how it works"\n\`\`\`\n\nIs there anything specific you'd like me to clarify?`
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}
