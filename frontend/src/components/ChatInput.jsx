import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { Send, Square, HelpCircle, Paperclip, X, FileText, Image as ImageIcon, Mic, ZoomIn, Wand2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import FeedbackModal from './FeedbackModal';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker - use local file instead of CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Generate PDF thumbnail from first page
const generatePdfThumbnail = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    
    // Scale to fit in thumbnail
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

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_FILES = 5; // Maximum 5 files
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

// File Preview Modal Component for ChatInput
const FilePreviewModal = ({ file, previewUrl, isOpen, onClose }) => {
  const [pdfObjectUrl, setPdfObjectUrl] = useState(null);
  
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Create object URL for PDF when modal opens
  useEffect(() => {
    if (isOpen && file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPdfObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const isImage = file.type?.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-[90vw] max-h-[90vh] bg-[#1f1f1f] rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-[#2f2f2f] border-b border-[#3f3f3f]">
          <div className="flex items-center gap-3 min-w-0">
            {isImage ? (
              <ImageIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
            ) : (
              <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className="text-sm text-gray-200 truncate max-w-[300px]">{file.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#3f3f3f]"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="p-4 max-h-[calc(90vh-60px)] overflow-auto flex items-center justify-center">
          {isImage && previewUrl ? (
            <img 
              src={previewUrl} 
              alt={file.name}
              className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg"
            />
          ) : isPdf && pdfObjectUrl ? (
            <div className="flex flex-col items-center w-full">
              <iframe
                src={pdfObjectUrl}
                title={file.name}
                className="w-full h-[70vh] min-w-[600px] rounded-lg border border-[#3f3f3f] bg-white"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p>Vorschau nicht verfügbar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatInput = ({ droppedFile, dropError, onDroppedFileProcessed }) => {
  const [message, setMessage] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState({});
  const [fileError, setFileError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewModalFile, setPreviewModalFile] = useState(null);
  const [isImageEditMode, setIsImageEditMode] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const { sendMessage, sendMessageWithFiles, sendVoiceMessage, isLoading, stopGeneration, isTyping } = useChatContext();
  const { isAuthenticated } = useAuth();

  // Handle dropped file from global drop zone
  useEffect(() => {
    const handleDroppedFile = async () => {
      if (droppedFile) {
        // Check if we can add more files
        if (selectedFiles.length >= MAX_FILES) {
          setFileError(`Maximal ${MAX_FILES} Dateien erlaubt`);
          if (onDroppedFileProcessed) {
            onDroppedFileProcessed();
          }
          return;
        }
        
        setSelectedFiles(prev => [...prev, droppedFile]);
        setFileError(null);
        
        // Create preview for images
        if (droppedFile.type.startsWith('image/')) {
          const previewUrl = URL.createObjectURL(droppedFile);
          setFilePreviews(prev => ({ ...prev, [droppedFile.name + droppedFile.size]: previewUrl }));
        }
        // Generate thumbnail for PDFs
        else if (droppedFile.type === 'application/pdf') {
          const pdfThumbnail = await generatePdfThumbnail(droppedFile);
          if (pdfThumbnail) {
            setFilePreviews(prev => ({ ...prev, [droppedFile.name + droppedFile.size]: pdfThumbnail }));
          }
        }
        
        // Clear the dropped file from parent
        if (onDroppedFileProcessed) {
          onDroppedFileProcessed();
        }
      }
    };
    
    handleDroppedFile();
  }, [droppedFile, onDroppedFileProcessed, selectedFiles.length]);

  // Handle drop error from global drop zone
  useEffect(() => {
    if (dropError) {
      setFileError(dropError);
      if (onDroppedFileProcessed) {
        onDroppedFileProcessed();
      }
    }
  }, [dropError, onDroppedFileProcessed]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '52px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [message]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      Object.values(filePreviews).forEach(url => URL.revokeObjectURL(url));
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [filePreviews]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    setFileError(null);
    
    if (!files.length) return;
    
    // Check total file count
    const totalFiles = selectedFiles.length + files.length;
    if (totalFiles > MAX_FILES) {
      setFileError(`Maximal ${MAX_FILES} Dateien erlaubt. Sie haben bereits ${selectedFiles.length} ausgewählt.`);
      return;
    }
    
    const newFiles = [];
    const newPreviews = {};
    
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError('Nur Bilder (JPEG, PNG, GIF, WebP) und PDF-Dateien erlaubt');
        return;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`Datei "${file.name}" zu groß. Maximum: ${MAX_FILE_SIZE / (1024 * 1024)} MB`);
        return;
      }
      
      newFiles.push(file);
      
      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        newPreviews[file.name + file.size] = previewUrl;
      }
      // Generate thumbnail for PDFs
      else if (file.type === 'application/pdf') {
        const pdfThumbnail = await generatePdfThumbnail(file);
        if (pdfThumbnail) {
          newPreviews[file.name + file.size] = pdfThumbnail;
        }
      }
    }
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setFilePreviews(prev => ({ ...prev, ...newPreviews }));
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index) => {
    const fileToRemove = selectedFiles[index];
    const fileKey = fileToRemove.name + fileToRemove.size;
    
    if (filePreviews[fileKey]) {
      URL.revokeObjectURL(filePreviews[fileKey]);
      setFilePreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[fileKey];
        return newPreviews;
      });
    }
    
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFileError(null);
  };

  const clearAllFiles = () => {
    Object.values(filePreviews).forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setFilePreviews({});
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Send the voice message
        if (audioFile.size > 0) {
          await sendVoiceMessage(audioFile);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setFileError('Mikrofon-Zugriff nicht erlaubt. Bitte erlauben Sie den Zugriff in Ihren Browser-Einstellungen.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Remove the onstop handler to prevent sending
      mediaRecorderRef.current.onstop = () => {
        // Just stop the tracks without sending
        const stream = mediaRecorderRef.current.stream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
      audioChunksRef.current = [];
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleImageEditMode = () => {
    setIsImageEditMode(prev => !prev);
    setFileError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading || isTyping) {
      stopGeneration();
      return;
    }

    const hasMessage = message.trim();
    const hasFiles = selectedFiles.length > 0;
    const hasImageFiles = selectedFiles.some(f => f.type?.startsWith('image/'));

    if (!hasMessage && !hasFiles) return;

    // Validierung: Wenn Bildbearbeitung aktiviert ist, MUSS Text vorhanden sein
    if (isImageEditMode && hasImageFiles && !hasMessage) {
      setFileError('Bitte beschreiben Sie, wie das Bild bearbeitet werden soll');
      return;
    }

    // Store values before clearing
    const messageToSend = message.trim();
    const filesToSend = [...selectedFiles];
    const actionMode = isImageEditMode && hasImageFiles ? 'edit_image' : undefined;

    // Clear input state IMMEDIATELY before sending
    setMessage('');
    if (filesToSend.length > 0) {
      // Clear file state immediately
      Object.values(filePreviews).forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setFilePreviews({});
      setFileError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '52px';
      textareaRef.current.focus();
    }

    // Now send the message with the stored values
    if (filesToSend.length > 0) {
      await sendMessageWithFiles(messageToSend, filesToSend, actionMode);
    } else {
      sendMessage(messageToSend);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="px-3 md:px-4 pb-3 md:pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="relative bg-[#2f2f2f] rounded-2xl border border-[#3f3f3f] focus-within:border-[#5f5f5f] transition-colors">
            {/* Recording Indicator */}
            {isRecording && (
              <div className="px-3 md:px-4 pt-3">
                <div className="flex items-center gap-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 text-sm font-medium">
                    Aufnahme läuft... {formatRecordingTime(recordingTime)}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white hover:bg-[#3f3f3f]"
                      onClick={cancelRecording}
                      data-testid="cancel-recording-btn"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Abbrechen
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                      onClick={stopRecording}
                      data-testid="stop-send-recording-btn"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Senden
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* File Preview Area */}
            {selectedFiles.length > 0 && !isRecording && (
              <div className="px-3 md:px-4 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">{selectedFiles.length} von {MAX_FILES} Dateien</span>
                  {selectedFiles.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-400 hover:text-white h-6 px-2"
                      onClick={clearAllFiles}
                    >
                      Alle entfernen
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => {
                    const fileKey = file.name + file.size;
                    const preview = filePreviews[fileKey];
                    const isImage = file.type?.startsWith('image/');
                    const isPdf = file.type === 'application/pdf';
                    const canPreview = isImage || isPdf;
                    
                    return (
                      <div key={fileKey} className="flex items-center gap-2 p-2 bg-[#3f3f3f] rounded-lg max-w-[200px] group">
                        {/* Clickable preview area */}
                        <button
                          type="button"
                          onClick={canPreview ? () => setPreviewModalFile({ file, previewUrl: preview }) : undefined}
                          className={`flex-shrink-0 relative ${canPreview ? 'cursor-pointer' : ''}`}
                          title={canPreview ? 'Klicken zum Anzeigen' : undefined}
                        >
                          {preview ? (
                            <img 
                              src={preview} 
                              alt="Preview" 
                              className="w-10 h-10 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-[#4f4f4f] rounded-md flex items-center justify-center">
                              {isPdf ? (
                                <FileText className="w-5 h-5 text-red-400" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-blue-400" />
                              )}
                            </div>
                          )}
                          {/* Zoom overlay on hover */}
                          {canPreview && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                              <ZoomIn className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-200 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0 text-gray-400 hover:text-white hover:bg-[#5f5f5f]"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error Message */}
            {fileError && (
              <div className="px-3 md:px-4 pt-3">
                <p className="text-sm text-red-400">{fileError}</p>
              </div>
            )}

            {/* Input area */}
            <div className="flex flex-col">
              <div className="flex items-start px-3 md:px-4 pt-3 pb-2 gap-2">
                  <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRecording ? "Aufnahme läuft..." : selectedFiles.length > 0 ? "Nachricht zu den Dateien hinzufügen..." : "Nachricht eingeben..."}
                  rows={1}
                  className="flex-1 bg-transparent text-white text-sm md:text-base resize-none outline-none placeholder-gray-500 max-h-[200px] overflow-y-auto py-1"
                  style={{ lineHeight: '1.5' }}
                  disabled={isLoading || isRecording}
                />
              </div>
              
              {/* Bottom toolbar */}
              <div className="flex items-center justify-between px-3 pb-3 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* File Upload Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full flex-shrink-0 transition-colors bg-[#3f3f3f] hover:bg-[#4f4f4f]"
                    type="button"
                    onClick={openFileDialog}
                    disabled={isLoading || isRecording || selectedFiles.length >= MAX_FILES}
                    title={selectedFiles.length >= MAX_FILES ? `Maximal ${MAX_FILES} Dateien` : "Bilder oder PDFs anhängen (max. 5)"}
                  >
                    <Paperclip className="h-5 w-5 text-gray-300 transition-all duration-200 opacity-70 hover:opacity-100" />
                  </Button>

                  {/* Image Edit Mode Toggle */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 rounded-full flex-shrink-0 transition-all duration-200 ${
                      isImageEditMode 
                        ? 'bg-green-500/30 hover:bg-green-500/40' 
                        : 'bg-[#3f3f3f] hover:bg-[#4f4f4f]'
                    }`}
                    type="button"
                    onClick={toggleImageEditMode}
                    disabled={isLoading || isRecording}
                    title={isImageEditMode ? "Bildbearbeitung aktiv - Bilder werden bearbeitet" : "Bildbearbeitung aktivieren"}
                  >
                    <Wand2 className={`h-5 w-5 transition-all duration-200 ${
                      isImageEditMode 
                        ? 'text-green-400 opacity-100' 
                        : 'text-gray-300 opacity-70 hover:opacity-100'
                    }`} />
                  </Button>

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

                  {/* Feedback Button - only show when authenticated */}
                  {isAuthenticated && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full flex-shrink-0 transition-colors bg-[#3f3f3f] hover:bg-[#4f4f4f]"
                      type="button"
                      onClick={() => setFeedbackOpen(true)}
                      title="Feedback senden"
                    >
                      <HelpCircle className="h-5 w-5 text-gray-300 transition-all duration-200 opacity-70 hover:opacity-100" />
                    </Button>
                  )}
                </div>

                {/* Right side: Mic + Send buttons */}
                <div className="flex items-center gap-2">
                  {/* Voice Recording Button */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 rounded-full flex-shrink-0 transition-colors ${
                      isRecording 
                        ? 'bg-red-500/30 hover:bg-red-500/40' 
                        : 'bg-[#3f3f3f] hover:bg-[#4f4f4f]'
                    }`}
                    type="button"
                    onClick={isRecording ? cancelRecording : startRecording}
                    disabled={isLoading || selectedFiles.length > 0}
                    title={isRecording ? "Aufnahme abbrechen" : "Sprachnachricht aufnehmen"}
                    data-testid="voice-recording-btn"
                  >
                    {isRecording ? (
                      <X className="h-5 w-5 text-red-400" />
                    ) : (
                      <Mic className="h-5 w-5 text-gray-300 transition-all duration-200 opacity-70 hover:opacity-100" />
                    )}
                  </Button>

                  {/* Send Button */}
                  <Button
                    type="submit"
                    disabled={(!message.trim() && selectedFiles.length === 0 && !isLoading && !isTyping) || isRecording}
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0
                      ${isLoading || isTyping 
                        ? 'bg-white text-black hover:bg-gray-200' 
                        : (message.trim() || selectedFiles.length > 0)
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
          </div>
        </form>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-500 mt-3">
          Die BauKI kann Fehler machen. Bitte überprüfen Sie wichtige Informationen.
        </p>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={feedbackOpen} 
        onClose={() => setFeedbackOpen(false)} 
      />

      {/* File Preview Modal */}
      {previewModalFile && (
        <FilePreviewModal
          file={previewModalFile.file}
          previewUrl={previewModalFile.previewUrl}
          isOpen={!!previewModalFile}
          onClose={() => setPreviewModalFile(null)}
        />
      )}
    </div>
  );
};

export default ChatInput;
