import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import AdminDashboard from './pages/AdminDashboard';
import GlobalDropZone from './components/GlobalDropZone';
import './App.css';
import './components/mobile-optimizations.css';
import './theme.css';

// Wrapper component to access ChatContext for file drop
const ChatWithDropZone = () => {
  const [droppedFile, setDroppedFile] = React.useState(null);
  const [dropError, setDropError] = React.useState(null);

  const handleFileDrop = (file, error) => {
    if (error) {
      setDropError(error);
      setDroppedFile(null);
    } else {
      setDroppedFile(file);
      setDropError(null);
    }
  };

  // Clear dropped file after it's been processed
  const clearDroppedFile = () => {
    setDroppedFile(null);
    setDropError(null);
  };

  return (
    <GlobalDropZone onFileDrop={handleFileDrop}>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#212121]">
        <Sidebar />
        <main className="flex-1 relative">
          <ChatArea 
            droppedFile={droppedFile} 
            dropError={dropError}
            onDroppedFileProcessed={clearDroppedFile}
          />
        </main>
      </div>
    </GlobalDropZone>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Admin Dashboard Route */}
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* Main Chat Route */}
            <Route path="*" element={
              <ChatProvider>
                <ChatWithDropZone />
              </ChatProvider>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
