import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <div className="flex h-screen bg-[#7A746B] overflow-hidden">
          <Sidebar />
          <main className="flex-1 relative">
            <ChatArea />
          </main>
        </div>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
