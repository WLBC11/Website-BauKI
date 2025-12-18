import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const RenameChatModal = ({ isOpen, onClose, currentTitle, onRename }) => {
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewTitle(currentTitle || '');
    }
  }, [isOpen, currentTitle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    setLoading(true);
    try {
      await onRename(newTitle.trim());
      onClose();
    } catch (err) {
      console.error('Error renaming chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2f2f2f] border-[#3f3f3f] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Chat umbenennen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="chat-title" className="text-gray-300">Neuer Name</Label>
            <Input 
              id="chat-title"
              type="text" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-[#3f3f3f] border-[#4f4f4f] text-white"
              placeholder="Chat-Name eingeben..."
              autoFocus
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="flex-1 bg-[#3f3f3f] text-gray-200 hover:bg-[#4f4f4f] hover:text-white"
            >
              Abbrechen
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !newTitle.trim()} 
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenameChatModal;
