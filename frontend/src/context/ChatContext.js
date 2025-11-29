import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { models } from '../data/mockData';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatContext = createContext();

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Load conversations from backend on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await axios.get(`${API}/conversations`);
        const convs = response.data.map(conv => ({
          ...conv,
          createdAt: new Date(conv.created_at),
          messages: conv.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(convs);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };
    loadConversations();
  }, []);

  const createNewConversation = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  const selectConversation = useCallback((id) => {
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback(async (id) => {
    try {
      await axios.delete(`${API}/conversations/${id}`);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
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
    let isNewConversation = false;

    if (!conversationId) {
      // Create new conversation locally first for immediate UI feedback
      conversationId = `conv-${Date.now()}`;
      isNewConversation = true;
      const newConversation = {
        id: conversationId,
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        messages: [userMessage],
        createdAt: new Date()
      };
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(conversationId);
    } else {
      // Add user message to existing conversation
      setConversations(prev => prev.map(c => 
        c.id === conversationId 
          ? { ...c, messages: [...c.messages, userMessage] }
          : c
      ));
    }

    // Call backend API
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API}/chat`, {
        message: content.trim(),
        conversation_id: isNewConversation ? null : conversationId,
        session_id: conversationId
      });

      const aiMessage = {
        id: response.data.message_id,
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };

      // Update conversation with the real conversation ID from backend
      const realConversationId = response.data.conversation_id;
      
      setConversations(prev => prev.map(c => {
        if (c.id === conversationId) {
          return { 
            ...c, 
            id: realConversationId,
            messages: [...c.messages, aiMessage] 
          };
        }
        return c;
      }));

      // Update active conversation ID if it changed
      if (conversationId !== realConversationId) {
        setActiveConversationId(realConversationId);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      const errorMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.response?.data?.detail || error.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };

      setConversations(prev => prev.map(c => 
        c.id === conversationId 
          ? { ...c, messages: [...c.messages, errorMessage] }
          : c
      ));
    }

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
