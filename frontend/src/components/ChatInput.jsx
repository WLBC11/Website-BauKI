import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { Send, Square, HelpCircle, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import FeedbackModal from './FeedbackModal';

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
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

const ChatInput = () => {
  const [message, setMessage] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileError, setFileError] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const { sendMessage, sendMessageWithFile, isLoading, stopGeneration, isTyping } = useChatContext();
  const { isAuthenticated } = useAuth();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '52px'; // Reset to minimum height
      const scrollHeight = textareaRef.current.scrollHeight;
      // Max height of 200px (approx 8 lines)
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [message]);

  // Clean up file preview URL on unmount
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    setFileError(null);
    
    if (!file) return;
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Nur Bilder (JPEG, PNG, GIF, WebP) und PDF-Dateien erlaubt');
      return;
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`Datei zu groß. Maximum: ${MAX_FILE_SIZE / (1024 * 1024)} MB`);
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading || isTyping) {
      stopGeneration();
      return;
    }

    const hasMessage = message.trim();
    const hasFile = selectedFile;

    if (!hasMessage && !hasFile) return;

    // If we have a file, use the file upload function
    if (hasFile) {
      await sendMessageWithFile(message.trim() || 'Bitte analysiere diese Datei.', selectedFile);
      handleRemoveFile();
    } else {
      sendMessage(message);
    }
    
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '52px';
      textareaRef.current.focus();
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
            {/* File Preview Area */}
            {selectedFile && (
              <div className="px-3 md:px-4 pt-3">
                <div className="flex items-center gap-3 p-2 bg-[#3f3f3f] rounded-lg">
                  {/* File Icon/Preview */}
                  <div className="flex-shrink-0">
                    {filePreview ? (
                      <img 
                        src={filePreview} 
                        alt="Preview" 
                        className="w-12 h-12 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-[#4f4f4f] rounded-md flex items-center justify-center">
                        {selectedFile.type === 'application/pdf' ? (
                          <FileText className="w-6 h-6 text-red-400" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-blue-400" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  
                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0 text-gray-400 hover:text-white hover:bg-[#5f5f5f]"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
                  placeholder={selectedFile ? "Nachricht zur Datei hinzufügen..." : "Nachricht eingeben..."}
                  rows={1}
                  className="flex-1 bg-transparent text-white text-sm md:text-base resize-none outline-none placeholder-gray-500 max-h-[200px] overflow-y-auto py-1"
                  style={{ lineHeight: '1.5' }}
                  disabled={isLoading}
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
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full flex-shrink-0 transition-colors bg-[#3f3f3f] hover:bg-[#4f4f4f]"
                    type="button"
                    onClick={openFileDialog}
                    disabled={isLoading}
                    title="Bild oder PDF anhängen"
                  >
                    <Paperclip className="h-5 w-5 text-gray-300 transition-all duration-200 opacity-70 hover:opacity-100" />
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

                {/* Send Button */}
                <Button
                  type="submit"
                  disabled={(!message.trim() && !selectedFile && !isLoading && !isTyping)}
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0
                    ${isLoading || isTyping 
                      ? 'bg-white text-black hover:bg-gray-200' 
                      : (message.trim() || selectedFile)
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

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={feedbackOpen} 
        onClose={() => setFeedbackOpen(false)} 
      />
    </div>
  );
};

export default ChatInput;
