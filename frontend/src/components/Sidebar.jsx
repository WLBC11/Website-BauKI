import React, { useState } from 'react';
import { useChatContext } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { Plus, MessageSquare, Trash2, Menu, PanelLeftClose, User, LogOut, Search, ChevronDown, Settings, Key, UserX, FileText, BarChart3 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from './ui/dropdown-menu';
import AuthModal from './AuthModal';
import ChangePasswordModal from './ChangePasswordModal';
import DeleteAccountModal from './DeleteAccountModal';
import LegalModal from './LegalModal';

const ADMIN_EMAILS = [
  'weiss.jonathan1107@outlook.com',
  'lukas.lust11@gmail.com'
];

const BUNDESLAENDER = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen"
];

const Sidebar = () => {
  const {
    conversations,
    activeConversationId,
    createNewConversation,
    selectConversation,
    deleteConversation,
    sidebarOpen,
    toggleSidebar
  } = useChatContext();

  const { user, isAuthenticated, logout, updateBundesland } = useAuth();

  // Check if user is admin
  const isAdmin = isAuthenticated && user && ADMIN_EMAILS.includes(user.email.toLowerCase());

  // Removed hoveredId state in favor of CSS group-hover for better performance and reliability
  const [searchQuery, setSearchQuery] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // Settings modals
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 25);

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleDeleteClick = (e, conversationId) => {
    e.stopPropagation();
    setDeleteConfirmId(conversationId);
  };

  const confirmDelete = (e) => {
    e.stopPropagation();
    if (deleteConfirmId) {
      deleteConversation(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = (e) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  if (!sidebarOpen) {
    return (
      <>
        <div className="fixed top-0 left-0 z-50 p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)} 
          initialMode={authMode}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full w-[260px] bg-[#171717] border-r border-[#2f2f2f]">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#2f2f2f]">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-lg"
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>
          <div className="relative group">
            <Button
              variant="ghost"
              size="icon"
              onClick={createNewConversation}
              className="text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-lg"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <div className="absolute right-0 top-full mt-1 px-2 py-1 bg-[#3f3f3f] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              Neuer Chat
            </div>
          </div>
        </div>

        {/* App Name */}
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold">
              <span className="text-lg">BauKI</span>
              <span className="text-xs text-gray-400 ml-1">by WLBC</span>
            </div>
            <div className="h-7 w-7 rounded-full bg-[#3a3a3a] flex items-center justify-center overflow-hidden p-1">
              <img 
                src="/baumate-logo.png" 
                alt="BauKI" 
                className="h-full w-full object-contain"
                style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }}
              />
            </div>
          </div>
        </div>

        {/* Bundesland Selector - only when authenticated */}
        {isAuthenticated && (
          <div className="px-3 pb-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-[#2f2f2f] border-[#3f3f3f] text-gray-200 hover:bg-[#3f3f3f] hover:text-white"
                >
                  <span className="text-sm truncate">
                    {user?.bundesland || "Bundesland wählen"}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[230px] bg-[#2f2f2f] border-[#3f3f3f] text-gray-200 max-h-[300px] overflow-y-auto">
                <DropdownMenuLabel>Landesbauordnung</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#3f3f3f]" />
                <DropdownMenuRadioGroup value={user?.bundesland || ""} onValueChange={updateBundesland}>
                  {BUNDESLAENDER.map(land => (
                    <DropdownMenuRadioItem
                      key={land}
                      value={land}
                      className="focus:bg-[#3f3f3f] focus:text-white cursor-pointer"
                    >
                      {land}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Auth Info for Guests */}
        {!isAuthenticated && (
          <div className="px-3 pb-3">
            <div className="bg-[#2f2f2f] rounded-lg p-3 text-sm">
              <p className="text-gray-400 mb-2">
                Melde dich an, um deine Chats zu speichern.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => openAuthModal('login')}
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-white hover:bg-[#3f3f3f]"
                >
                  Anmelden
                </Button>
                <Button
                  onClick={() => openAuthModal('register')}
                  size="sm"
                  className="flex-1 bg-white text-black hover:bg-gray-200"
                >
                  Registrieren
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Search - only show when authenticated */}
        {isAuthenticated && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Chats durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2f2f2f] text-gray-200 text-sm rounded-lg pl-10 pr-4 py-2 border-none outline-none focus:ring-1 focus:ring-[#4f4f4f] placeholder-gray-500"
              />
            </div>
          </div>
        )}

        {/* Conversations List - only show when authenticated */}
        {isAuthenticated ? (
          <ScrollArea className="flex-1 px-1 relative z-10">
            <div className="mb-4">
              <h3 className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chats
              </h3>
              {filteredConversations.map(conv => {
                const isActive = activeConversationId === conv.id;
                const isConfirmingDelete = deleteConfirmId === conv.id;
                
                return (
                  <div
                    key={conv.id}
                    className={`group relative mx-2 rounded-lg cursor-pointer transition-colors duration-150 z-0
                      ${isActive ? 'bg-[#2f2f2f]' : 'hover:bg-[#2f2f2f]/50'}
                      ${isConfirmingDelete ? 'bg-red-900/20 border border-red-900/50' : ''}`}
                    onClick={() => !isConfirmingDelete && selectConversation(conv.id)}
                    title={!isConfirmingDelete ? conv.title : ''}
                  >
                    {!isConfirmingDelete ? (
                      <div className="flex items-center py-2 pl-3 pr-3">
                        {/* Icon Container - Swaps on hover */}
                        <div className="relative w-4 h-4 mr-3 flex-shrink-0 flex items-center justify-center">
                          {/* Normal Icon (Speech Bubble) - Hidden on hover */}
                          <MessageSquare className="h-4 w-4 text-gray-400 group-hover:hidden" />
                          
                          {/* Delete Icon - Visible on hover */}
                          <button
                              onClick={(e) => handleDeleteClick(e, conv.id)}
                              className="hidden group-hover:flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
                              title="Chat löschen"
                          >
                              <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex-1 overflow-hidden relative min-w-0">
                          <span className="block truncate text-sm text-gray-200">
                            {conv.title}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-2 pl-3 pr-2">
                        <span className="text-xs text-red-200 flex-1">Löschen?</span>
                        <button
                          onClick={confirmDelete}
                          className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        >
                          Ja
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                        >
                          Nein
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredConversations.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  {searchQuery ? 'Keine Chats gefunden' : 'Noch keine Unterhaltungen'}
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 px-4 py-8 text-center text-gray-500 text-sm">
            Melde dich an, um deine Chat-Verlauf zu sehen.
          </div>
        )}

        {/* User Section */}
        <div className="border-t border-[#2f2f2f] p-3">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-gray-200 hover:bg-[#2f2f2f] py-3"
                >
                  <div className="h-8 w-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm truncate">{user?.name || user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[230px] bg-[#2f2f2f] border-[#3f3f3f]" align="start" side="top">
                <DropdownMenuItem className="text-gray-400 text-xs cursor-default hover:bg-transparent">
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#3f3f3f]" />
                <DropdownMenuLabel className="text-gray-400 text-xs font-normal">Einstellungen</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setChangePasswordOpen(true)} className="text-gray-200 cursor-pointer">
                  <Key className="h-4 w-4 mr-2" />
                  Passwort ändern
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteAccountOpen(true)} className="text-gray-200 cursor-pointer">
                  <UserX className="h-4 w-4 mr-2" />
                  Konto löschen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLegalOpen(true)} className="text-gray-200 cursor-pointer">
                  <FileText className="h-4 w-4 mr-2" />
                  Rechtliches
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator className="bg-[#3f3f3f]" />
                    <DropdownMenuItem asChild>
                      <a href="/admin" className="text-gray-200 cursor-pointer flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </a>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="bg-[#3f3f3f]" />
                <DropdownMenuItem onClick={logout} className="text-gray-200 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => openAuthModal('login')}
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-200 hover:bg-[#2f2f2f] py-3"
            >
              <div className="h-8 w-8 rounded-full bg-[#3f3f3f] flex items-center justify-center text-gray-400">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm">Gast</span>
            </Button>
          )}
        </div>
      </div>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialMode={authMode}
      />
      
      {/* Settings Modals */}
      <ChangePasswordModal 
        isOpen={changePasswordOpen} 
        onClose={() => setChangePasswordOpen(false)} 
      />
      <DeleteAccountModal 
        isOpen={deleteAccountOpen} 
        onClose={() => setDeleteAccountOpen(false)} 
      />
      <LegalModal 
        isOpen={legalOpen} 
        onClose={() => setLegalOpen(false)} 
      />
    </>
  );
};

export default Sidebar;