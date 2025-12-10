import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import ResetPasswordModal from './ResetPasswordModal';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const { login, register } = useAuth();

  // Update mode when initialMode changes
  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      onClose();
      // Reset form
      setEmail('');
      setPassword('');
      setName('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  const handleForgotPassword = () => {
    onClose();
    setResetPasswordOpen(true);
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2f2f2f] border-[#3f3f3f] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Name (optional)</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dein Name"
                className="bg-[#3f3f3f] border-[#4f4f4f] text-white placeholder-gray-500 focus:border-[#5f5f5f]"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">E-Mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
              className="bg-[#3f3f3f] border-[#4f4f4f] text-white placeholder-gray-500 focus:border-[#5f5f5f]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Passwort</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="bg-[#3f3f3f] border-[#4f4f4f] text-white placeholder-gray-500 focus:border-[#5f5f5f]"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-gray-200 font-medium"
          >
            {isLoading ? 'Laden...' : (mode === 'login' ? 'Anmelden' : 'Registrieren')}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-400">
          {mode === 'login' ? (
            <>
              Noch kein Konto?{' '}
              <button onClick={switchMode} className="text-white hover:underline">
                Jetzt registrieren
              </button>
            </>
          ) : (
            <>
              Bereits ein Konto?{' '}
              <button onClick={switchMode} className="text-white hover:underline">
                Anmelden
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
