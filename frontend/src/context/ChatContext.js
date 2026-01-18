import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { models } from '../data/mockData';
import { useAuth } from './AuthContext';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Auto-detect backend URL based on current hostname
const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If on preview domain, use preview backend
    if (hostname.includes('preview.emergentagent.com')) {
      return 'https://ai-text2img-chat.preview.emergentagent.com';
    }
    // If on localhost, use preview backend
    if (hostname === 'localhost') {
      return 'https://ai-text2img-chat.preview.emergentagent.com';
    }
    // For production domain bauki.eu, use https://bauki.eu
    return `https://${hostname}`;
  }
  return process.env.REACT_APP_BACKEND_URL || 'https://bauki.eu';
};

const BACKEND_URL = getBackendUrl();
const API = `${BACKEND_URL}/api`;

// Image compression settings
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB target size
const MAX_IMAGE_DIMENSION = 2048; // Max width/height

// Generate PDF thumbnail from file
const generatePdfThumbnail = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating PDF thumbnail:', error);
    return null;
  }
};

// Compress image using canvas
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    // If not an image, return original file
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    // If already small enough, return original
    if (file.size <= MAX_IMAGE_SIZE) {
      console.log(`Image already small enough: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      resolve(file);
      return;
    }

    console.log(`Compressing image from ${(file.size / 1024 / 1024).toFixed(2)} MB...`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if too large
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = (height / width) * MAX_IMAGE_DIMENSION;
            width = MAX_IMAGE_DIMENSION;
          } else {
            width = (width / height) * MAX_IMAGE_DIMENSION;
            height = MAX_IMAGE_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels to get under target size
        const tryCompress = (quality) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Bildkomprimierung fehlgeschlagen'));
                return;
              }

              console.log(`Compressed to ${(blob.size / 1024 / 1024).toFixed(2)} MB at quality ${quality}`);

              // If still too large and quality can be reduced, try again
              if (blob.size > MAX_IMAGE_SIZE && quality > 0.3) {
                tryCompress(quality - 0.1);
              } else {
                // Create new file with compressed data
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, '.jpg'),
                  { type: 'image/jpeg' }
                );
                console.log(`Final compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
                resolve(compressedFile);
              }
            },
            'image/jpeg',
            quality
          );
        };

        // Start with 0.8 quality
        tryCompress(0.8);
      };

      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
    reader.readAsDataURL(file);
  });
};

// Safe N8N response parser - handles JSON, Python-style dicts, and plain text
function safeParseN8n(payload) {
  if (payload && typeof payload === "object") return payload;

  if (typeof payload !== "string") return { type: "text", text: String(payload ?? "") };

  // try proper JSON
  try { return JSON.parse(payload); } catch {}

  // try python-style dict -> json
  try {
    const fixed = payload
      .replace(/\\n/g, "\\n")
      .replace(/\\'/g, "__SQUOTE__")
      .replace(/'/g, '"')
      .replace(/__SQUOTE__/g, "'");
    return JSON.parse(fixed);
  } catch {}

  return { type: "text", text: payload };
}

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

  const renameConversation = useCallback(async (id, newTitle) => {
    if (!isAuthenticated || !newTitle.trim()) return;
    try {
      await axios.patch(`${API}/conversations/${id}`, { title: newTitle.trim() });
      setConversations(prev => prev.map(c => 
        c.id === id ? { ...c, title: newTitle.trim() } : c
      ));
    } catch (error) {
      console.error('Failed to rename conversation:', error);
    }
  }, [isAuthenticated]);

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

  const sendMessage = useCallback(async (content, action) => {
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
      const requestData = {
        message: content.trim(),
        conversation_id: isNewConversation ? null : conversationId,
        session_id: conversationId
      };
      
      // Add action field if provided
      if (action) {
        requestData.action = action;
      }
      
      const response = await axios.post(`${API}/chat`, requestData, {
        signal: abortControllerRef.current.signal
      });

      // Parse N8N response using safe parser
      const parsed = safeParseN8n(response.data.response);
      
      let messageType = 'text';
      let messageContent = '';
      let imageUrl = null;

      if (parsed.type === 'image' && parsed.imageUrl) {
        messageType = 'image';
        // Route external image URLs through backend proxy to avoid CORS issues
        imageUrl = `${API}/image-proxy?url=${encodeURIComponent(parsed.imageUrl)}`;
        messageContent = ''; // Kein Text, nur Bild
      } else if (parsed.type === 'text' && parsed.text) {
        messageType = 'text';
        messageContent = parsed.text;
      } else if (parsed.text) {
        // Fallback: nur text property ohne type
        messageType = 'text';
        messageContent = parsed.text;
      } else {
        // Fallback: zeige als normalen Text
        messageType = 'text';
        messageContent = String(response.data.response);
      }

      const aiMessage = {
        id: response.data.message_id,
        role: 'assistant',
        content: messageContent,
        type: messageType,
        imageUrl: imageUrl,
        timestamp: new Date(),
        shouldAnimate: messageType === 'text' // Nur Text animieren, nicht Bilder
      };

      // Set typing state for animation - NUR bei Text-Nachrichten
      if (messageType === 'text') {
        setIsTyping(true);
      }

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

  }, [activeConversationId, currentGuestConversation, isAuthenticated]);

  // Send message with files (images or PDFs) - supports multiple files
  const sendMessageWithFiles = useCallback(async (content, files, action) => {
    if (!files || files.length === 0) return;

    // Process all files (compress images if needed)
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        if (file.type.startsWith('image/')) {
          try {
            return await compressImage(file);
          } catch (error) {
            console.error('Image compression failed:', error);
            return file;
          }
        }
        return file;
      })
    );

    // Create file infos for display - generate previews for both images and PDFs
    const fileInfos = await Promise.all(
      processedFiles.map(async (file) => {
        const fileInfo = {
          name: file.name,
          type: file.type,
          fileType: file.type.startsWith('image/') ? 'image' : 'pdf',
          size: file.size
        };
        
        if (file.type.startsWith('image/')) {
          fileInfo.preview = URL.createObjectURL(file);
        } else if (file.type === 'application/pdf') {
          // Generate PDF thumbnail for display
          const pdfPreview = await generatePdfThumbnail(file);
          if (pdfPreview) {
            fileInfo.preview = pdfPreview;
          }
          // Also store the full PDF data for modal viewing
          const arrayBuffer = await file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          fileInfo.data = base64;
        }
        
        return fileInfo;
      })
    );

    // For display: if no message, show file count instead
    const displayContent = content || '';
    const titleContent = content || (files.length === 1 ? files[0].name : `${files.length} Dateien`);

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: displayContent,
      timestamp: new Date(),
      files: fileInfos // Array of files instead of single file
    };

    let conversationId = activeConversationId;
    let isNewConversation = false;

    if (!conversationId && !currentGuestConversation) {
      conversationId = `conv-${Date.now()}`;
      isNewConversation = true;
      const newConversation = {
        id: conversationId,
        title: titleContent.slice(0, 30) + (titleContent.length > 30 ? '...' : ''),
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
      conversationId = currentGuestConversation.id;
      setCurrentGuestConversation(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage]
      }));
    } else {
      setConversations(prev => prev.map(c => 
        c.id === conversationId 
          ? { ...c, messages: [...c.messages, userMessage] }
          : c
      ));
    }

    setIsLoading(true);
    abortControllerRef.current = new AbortController();
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('message', content || '');
      
      // Append all files
      processedFiles.forEach((file) => {
        formData.append('files', file);
      });
      
      if (!isNewConversation && conversationId) {
        formData.append('conversation_id', conversationId);
      }
      formData.append('session_id', conversationId);
      
      // Add action field for image editing
      if (action) {
        formData.append('action', action);
      }

      const response = await axios.post(`${API}/chat/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        signal: abortControllerRef.current.signal,
        timeout: 180000 // 3 minute timeout for multiple file uploads
      });

      // Parse N8N response using safe parser
      const parsed = safeParseN8n(response.data.response);
      
      let messageType = 'text';
      let messageContent = '';
      let imageUrl = null;

      if (parsed.type === 'image' && parsed.imageUrl) {
        messageType = 'image';
        // Route external image URLs through backend proxy to avoid CORS issues
        imageUrl = `${API}/image-proxy?url=${encodeURIComponent(parsed.imageUrl)}`;
        messageContent = ''; // Kein Text, nur Bild
      } else if (parsed.type === 'text' && parsed.text) {
        messageType = 'text';
        messageContent = parsed.text;
      } else if (parsed.text) {
        // Fallback: nur text property ohne type
        messageType = 'text';
        messageContent = parsed.text;
      } else {
        // Fallback: zeige als normalen Text
        messageType = 'text';
        messageContent = String(response.data.response);
      }

      const aiMessage = {
        id: response.data.message_id,
        role: 'assistant',
        content: messageContent,
        type: messageType,
        imageUrl: imageUrl,
        timestamp: new Date(),
        shouldAnimate: messageType === 'text' // Nur Text animieren, nicht Bilder
      };

      // Set typing state for animation - NUR bei Text-Nachrichten
      if (messageType === 'text') {
        setIsTyping(true);
      }

      const realConversationId = response.data.conversation_id;
      const realTitle = response.data.title;
      
      if (!isAuthenticated || currentGuestConversation) {
        setCurrentGuestConversation(prev => {
          if (!prev) {
            return {
              id: realConversationId,
              title: realTitle || titleContent.slice(0, 30) + (titleContent.length > 30 ? '...' : ''),
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

        if (conversationId !== realConversationId) {
          setActiveConversationId(realConversationId);
        }
      }

    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled', error.message);
      } else {
        console.error('Failed to send message with files:', error);
        
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

  }, [activeConversationId, currentGuestConversation, isAuthenticated, token]);

  // Send voice message (audio recording)
  const sendVoiceMessage = useCallback(async (audioFile) => {
    if (!audioFile) return;

    // Create a placeholder message for the user
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: '',
      timestamp: new Date(),
      file: {
        name: audioFile.name,
        type: audioFile.type,
        fileType: 'audio',
        size: audioFile.size
      }
    };

    let conversationId = activeConversationId;
    let isNewConversation = false;

    if (!conversationId && !currentGuestConversation) {
      conversationId = `conv-${Date.now()}`;
      isNewConversation = true;
      const newConversation = {
        id: conversationId,
        title: 'Sprachnachricht',
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
      conversationId = currentGuestConversation.id;
      setCurrentGuestConversation(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage]
      }));
    } else {
      setConversations(prev => prev.map(c => 
        c.id === conversationId 
          ? { ...c, messages: [...c.messages, userMessage] }
          : c
      ));
    }

    setIsLoading(true);
    abortControllerRef.current = new AbortController();
    
    try {
      const formData = new FormData();
      formData.append('message', '');  // Empty message for voice
      formData.append('files', audioFile);  // Must use 'files' to match backend endpoint
      if (!isNewConversation && conversationId) {
        formData.append('conversation_id', conversationId);
      }
      formData.append('session_id', conversationId);

      const response = await axios.post(`${API}/chat/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        signal: abortControllerRef.current.signal,
        timeout: 120000
      });

      const aiMessage = {
        id: response.data.message_id,
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        shouldAnimate: true
      };

      setIsTyping(true);

      const realConversationId = response.data.conversation_id;
      const realTitle = response.data.title;
      
      if (!isAuthenticated || currentGuestConversation) {
        setCurrentGuestConversation(prev => {
          if (!prev) {
            return {
              id: realConversationId,
              title: realTitle || 'Sprachnachricht',
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

        if (conversationId !== realConversationId) {
          setActiveConversationId(realConversationId);
        }
      }

    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled', error.message);
      } else {
        console.error('Failed to send voice message:', error);
        
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

  }, [activeConversationId, currentGuestConversation, isAuthenticated, token]);

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
    renameConversation,
    sendMessage,
    sendMessageWithFiles,
    sendVoiceMessage,
    toggleSidebar,
    models,
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
