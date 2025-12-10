import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResetPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: Code & New Password
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post(`${API}/auth/request-password-reset`, { email });
      setMessage({ 
        type: 'success', 
        text: `Reset-Code: ${response.data.reset_code} (gültig für 15 Min.)` 
      });
      setStep(2);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || 'Fehler beim Anfordern des Reset-Codes' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!resetCode || !newPassword) {
      setMessage({ type: 'error', text: 'Bitte füllen Sie alle Felder aus.' });
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API}/auth/reset-password`, {
        email,
        reset_code: resetCode,
        new_password: newPassword
      });
      setMessage({ type: 'success', text: 'Passwort erfolgreich zurückgesetzt!' });
      
      // Close modal after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || 'Fehler beim Zurücksetzen des Passworts' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setResetCode('');
    setNewPassword('');
    setMessage({ type: '', text: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#2f2f2f] border-[#3f3f3f] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Passwort zurücksetzen</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {step === 1 ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-gray-300">E-Mail-Adresse</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.de"
                  required
                  className="bg-[#3f3f3f] border-[#4f4f4f] text-white placeholder-gray-500"
                />
              </div>

              <p className="text-sm text-gray-400">
                Sie erhalten einen 6-stelligen Reset-Code, der 15 Minuten gültig ist.
              </p>

              {message.text && (
                <div className={`flex items-start gap-2 p-3 rounded-lg ${
                  message.type === 'success' ? 'bg-green-900/20 border border-green-900/50' : 'bg-red-900/20 border border-red-900/50'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm ${message.type === 'success' ? 'text-green-200' : 'text-red-200'}`}>
                    {message.text}
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-white text-black hover:bg-gray-200"
              >
                {loading ? 'Wird gesendet...' : 'Reset-Code anfordern'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-code" className="text-gray-300">Reset-Code</Label>
                <Input
                  id="reset-code"
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="6-stelliger Code"
                  required
                  maxLength={6}
                  className="bg-[#3f3f3f] border-[#4f4f4f] text-white placeholder-gray-500 text-center text-lg tracking-widest"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-gray-300">Neues Passwort</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  required
                  minLength={6}
                  className="bg-[#3f3f3f] border-[#4f4f4f] text-white placeholder-gray-500"
                />
              </div>

              {message.text && (
                <div className={`flex items-start gap-2 p-3 rounded-lg ${
                  message.type === 'success' ? 'bg-green-900/20 border border-green-900/50' : 'bg-red-900/20 border border-red-900/50'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm ${message.type === 'success' ? 'text-green-200' : 'text-red-200'}`}>
                    {message.text}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex-1 text-gray-300 hover:bg-[#3f3f3f]"
                >
                  Zurück
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 bg-white text-black hover:bg-gray-200"
                >
                  {loading ? 'Wird gesetzt...' : 'Passwort zurücksetzen'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordModal;
