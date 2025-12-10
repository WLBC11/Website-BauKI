import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const { deleteAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await deleteAccount();
      onClose();
    } catch (err) {
      setMessage({ type: 'error', text: 'Fehler beim Löschen des Kontos.' });
      setLoading(false);
    }
  };

  // Reset state on close/open
  React.useEffect(() => {
    if (isOpen) {
      setDeleteConfirm(false);
      setMessage({ type: '', text: '' });
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2f2f2f] border-[#3f3f3f] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Konto dauerhaft löschen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!deleteConfirm ? (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Wenn Sie Ihr Konto löschen, werden alle Ihre Daten unwiderruflich gelöscht:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm ml-2">
                <li>Alle Chat-Verläufe</li>
                <li>Ihr Benutzerkonto</li>
                <li>Alle gespeicherten Einstellungen</li>
              </ul>
              <p className="text-gray-300 text-sm">
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              
              {message.text && (
                <p className="text-sm text-red-400">{message.text}</p>
              )}

              <Button 
                variant="destructive" 
                onClick={() => setDeleteConfirm(true)}
                className="w-full bg-red-900/50 hover:bg-red-900 text-red-100 border border-red-800"
              >
                Konto löschen
              </Button>
            </div>
          ) : (
            <div className="bg-red-900/20 p-4 rounded-md border border-red-900/50 space-y-4">
              <p className="text-sm text-red-200">
                Sind Sie absolut sicher? Dies löscht alle Ihre Daten unwiderruflich.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setDeleteConfirm(false)}
                  className="flex-1 hover:bg-red-900/30 text-red-200"
                >
                  Abbrechen
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? 'Wird gelöscht...' : 'Bestätigen'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountModal;
