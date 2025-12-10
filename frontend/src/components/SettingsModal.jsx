import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertTriangle } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
  const { changePassword, deleteAccount } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    if (!currentPassword || !newPassword) {
        setMessage({ type: 'error', text: 'Bitte füllen Sie beide Felder aus.' });
        return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Passwort erfolgreich geändert.' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Fehler beim Ändern des Passworts.' });
    } finally {
      setLoading(false);
    }
  };

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
        setCurrentPassword('');
        setNewPassword('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2f2f2f] border-[#3f3f3f] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Einstellungen</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Password Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Passwort ändern</h3>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="current-pass" className="text-gray-300">Aktuelles Passwort</Label>
                <Input 
                  id="current-pass"
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-[#3f3f3f] border-[#4f4f4f] text-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-pass" className="text-gray-300">Neues Passwort</Label>
                <Input 
                  id="new-pass"
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#3f3f3f] border-[#4f4f4f] text-white"
                />
              </div>
              
              {message.text && (
                <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {message.text}
                </p>
              )}
              
              <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-gray-200">
                Passwort aktualisieren
              </Button>
            </form>
          </div>

          <div className="h-px bg-[#3f3f3f]" />

          {/* Delete Account Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Konto dauerhaft löschen
            </h3>
            {!deleteConfirm ? (
              <Button 
                variant="destructive" 
                onClick={() => setDeleteConfirm(true)}
                className="w-full bg-red-900/50 hover:bg-red-900 text-red-100 border border-red-800"
              >
                Konto löschen
              </Button>
            ) : (
              <div className="bg-red-900/20 p-3 rounded-md border border-red-900/50 space-y-3">
                <p className="text-sm text-red-200">
                  Sind Sie sicher? Dies löscht alle Ihre Daten unwiderruflich.
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
                    Bestätigen
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;