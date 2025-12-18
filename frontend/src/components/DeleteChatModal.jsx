import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';

const DeleteChatModal = ({ isOpen, onClose, chatTitle, onDelete }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      console.error('Error deleting chat:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2f2f2f] border-[#3f3f3f] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-400" />
            Chat löschen
          </DialogTitle>
          <DialogDescription className="text-gray-400 pt-2">
            Möchten Sie diesen Chat wirklich löschen?
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 p-3 bg-[#3f3f3f] rounded-lg overflow-hidden">
          <p className="text-gray-200 text-sm truncate max-w-full">&ldquo;{chatTitle}&rdquo;</p>
        </div>

        <p className="text-gray-400 text-sm mt-2">
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
          
        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onClose}
            className="flex-1 bg-[#3f3f3f] text-gray-200 hover:bg-[#4f4f4f] hover:text-white"
          >
            Abbrechen
          </Button>
          <Button 
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Wird gelöscht...' : 'Löschen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteChatModal;
