import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    if (!currentPassword || !newPassword) {
      setMessage({ type: 'error', text: 'Bitte füllen Sie beide Felder aus.' });
      setLoading(false);
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

  // Reset state on close/open
  React.useEffect(() => {
    if (isOpen) {
      setMessage({ type: '', text: '' });
      setCurrentPassword('');
      setNewPassword('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2f2f2f] border-[#3f3f3f] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Passwort ändern</DialogTitle>
        </DialogHeader>

        <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="current-pass" className="text-gray-300">Aktuelles Passwort</Label>
            <Input 
              id="current-pass"
              type="password" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-[#3f3f3f] border-[#4f4f4f] text-white"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pass" className="text-gray-300">Neues Passwort</Label>
            <Input 
              id="new-pass"
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-[#3f3f3f] border-[#4f4f4f] text-white"
              minLength={6}
            />
          </div>
          
          {message.text && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </p>
          )}
          
          <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-gray-200">
            {loading ? 'Wird geändert...' : 'Passwort ändern'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordModal;
