import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { models } from '../data/mockData';
import { useAuth } from './AuthContext';
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
  const { isAuthenticated, token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [currentGuestConversation, setCurrentGuestConversation] = useState(null);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  // Use refs for request cancellation
  const abortControllerRef = useRef(null);

  const activeConversation = currentGuestConversation || conversations.find(c => c.id === activeConversationId);

  // Load conversations from backend when authenticated
  useEffect(() => {
    const loadConversations = async () => {
      if (!isAuthenticated || !token) {
        setConversations([]);
        return;
      }
      try {
        const response = await axios.get(`${API}/conversations`, {
            headers: { Authorization: `Bearer ${token}` }
        });
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
  }, [isAuthenticated, token]);

  // Reset guest conversation when user logs in
  useEffect(() => {
    if (isAuthenticated && currentGuestConversation) {
      // Optionally claim the guest conversation
      setCurrentGuestConversation(null);
      setActiveConversationId(null);
    }
  }, [isAuthenticated]);

  const createNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setCurrentGuestConversation(null);
    setIsTyping(false);
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
  }, []);

  const selectConversation = useCallback((id) => {
    setActiveConversationId(id);
    setCurrentGuestConversation(null);
    setIsTyping(false);
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
  }, []);

  const deleteConversation = useCallback(async (id) => {
    if (!isAuthenticated) return;
    try {
      await axios.delete(`${API}/conversations/${id}`);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }, [activeConversationId, isAuthenticated]);

  const stopGeneration = useCallback(() => {
    if (isLoading) {
      // Cancel network request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
    
    if (isTyping) {
      // Stop typing animation
      setIsTyping(false);
    }
  }, [isLoading, isTyping]);

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

    if (!conversationId && !currentGuestConversation) {
      // Create new conversation locally first for immediate UI feedback
      conversationId = `conv-${Date.now()}`;
      isNewConversation = true;
      const newConversation = {
        id: conversationId,
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        messages: [userMessage],
        createdAt: new Date()
      };
      
      if (isAuthenticated) {
        setConversations(prev => [newConversation, ...prev]);
        setActiveConversationId(conversationId);
      } else {
        setCurrentGuestConversation(newConversation);
      }
    } else if (currentGuestConversation) {
      // Guest mode - update local conversation
      conversationId = currentGuestConversation.id;
      setCurrentGuestConversation(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage]
      }));
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
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await axios.post(`${API}/chat`, {
        message: content.trim(),
        conversation_id: isNewConversation ? null : conversationId,
        session_id: conversationId,
        databases: activeDatabases
      }, {
        signal: abortControllerRef.current.signal
      });

      const aiMessage = {
        id: response.data.message_id,
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        shouldAnimate: true
      };

      // Set typing state for animation
      setIsTyping(true);

      // Update conversation with the real conversation ID from backend
      const realConversationId = response.data.conversation_id;
      const realTitle = response.data.title;
      
      if (!isAuthenticated || currentGuestConversation) {
        // Guest mode
        setCurrentGuestConversation(prev => {
          if (!prev) {
            return {
              id: realConversationId,
              title: realTitle || content.slice(0, 30) + (content.length > 30 ? '...' : ''),
              messages: [userMessage, aiMessage],
              createdAt: new Date()
            };
          }
          return {
            ...prev,
            id: realConversationId,
            title: realTitle || prev.title,
            messages: [...prev.messages, aiMessage]
          };
        });
      } else {
        setConversations(prev => prev.map(c => {
          if (c.id === conversationId) {
            return { 
              ...c, 
              id: realConversationId,
              title: realTitle || c.title,
              messages: [...c.messages, aiMessage] 
            };
          }
          return c;
        }));

        // Update active conversation ID if it changed
        if (conversationId !== realConversationId) {
          setActiveConversationId(realConversationId);
        }
      }

    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled', error.message);
        // Do not show error message for cancellations
      } else {
        console.error('Failed to send message:', error);
        
        // Add error message
        const errorMessage = {
          id: `msg-${Date.now()}-error`,
          role: 'assistant',
          content: `Entschuldigung, ein Fehler ist aufgetreten: ${error.response?.data?.detail || error.message || 'Unbekannter Fehler'}. Bitte versuche es erneut.`,
          timestamp: new Date()
        };

        if (!isAuthenticated || currentGuestConversation) {
          setCurrentGuestConversation(prev => prev ? {
            ...prev,
            messages: [...prev.messages, errorMessage]
          } : null);
        } else {
          setConversations(prev => prev.map(c => 
            c.id === conversationId 
              ? { ...c, messages: [...c.messages, errorMessage] }
              : c
          ));
        }
      }
    } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
    }

  }, [activeConversationId, currentGuestConversation, isAuthenticated, activeDatabases]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const value = {
    conversations,
    activeConversation,
    activeConversationId,
    currentGuestConversation,
    selectedModel,
    setSelectedModel,
    isLoading,
    sidebarOpen,
    createNewConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    toggleSidebar,
    models,
    activeDatabases,
    setActiveDatabases,
    stopGeneration,
    isTyping,
    setIsTyping
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
