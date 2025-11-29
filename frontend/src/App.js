import React from 'react';
import { ChatProvider } from './context/ChatContext';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './App.css';

function App() {
  return (
    <ChatProvider>
      <div className="flex h-screen bg-[#212121] overflow-hidden">
        <Sidebar />
        <main className="flex-1 relative">
          <ChatArea />
        </main>
      </div>
    </ChatProvider>
  );
}

export default App;
