import React, { useState, useEffect, useCallback } from 'react';
import { Upload } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const GlobalDropZone = ({ onFileDrop, children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    
    // Check if dragging files
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragging(false);
      }
      return newCount;
    });
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        onFileDrop(null, 'Nur Bilder (JPEG, PNG, GIF, WebP) und PDF-Dateien erlaubt');
        return;
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        onFileDrop(null, `Datei zu groß. Maximum: ${MAX_FILE_SIZE / (1024 * 1024)} MB`);
        return;
      }
      
      onFileDrop(file, null);
    }
  }, [onFileDrop]);

  useEffect(() => {
    // Add listeners to window for global drag & drop
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return (
    <>
      {children}
      
      {/* Full-page drop overlay */}
      {isDragging && (
        <div 
          className="fixed inset-0 z-[9999] bg-[#212121]/95 flex items-center justify-center pointer-events-none"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-blue-500 bg-blue-500/10">
            <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Upload className="w-10 h-10 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-white mb-2">Datei hier ablegen</p>
              <p className="text-sm text-gray-400">Bilder (JPEG, PNG, GIF, WebP) oder PDF</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalDropZone;
