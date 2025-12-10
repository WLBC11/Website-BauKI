import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Admin Dashboard Route */}
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Main Chat Route */}
          <Route path="*" element={
            <ChatProvider>
              <div className="flex h-screen bg-[#212121] overflow-hidden">
                <Sidebar />
                <main className="flex-1 relative">
                  <ChatArea />
                </main>
              </div>
            </ChatProvider>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
