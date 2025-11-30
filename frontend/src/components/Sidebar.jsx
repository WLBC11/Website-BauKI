import React, { useState } from 'react';
import { useChatContext } from '../context/ChatContext';
import { Plus, MessageSquare, Trash2, Menu, Settings, LogOut, ChevronDown, Search, PanelLeftClose } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Sidebar = () => {
  const {
    conversations,
    activeConversationId,
    createNewConversation,
    selectConversation,
    deleteConversation,
    sidebarOpen,
    toggleSidebar,
    selectedModel,
    setSelectedModel,
    models
  } = useChatContext();

  const [hoveredId, setHoveredId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by date
  const groupConversations = (convs) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups = {
      today: [],
      yesterday: [],
      lastWeek: [],
      older: []
    };

    convs.forEach(conv => {
      const convDate = new Date(conv.createdAt);
      if (convDate.toDateString() === today.toDateString()) {
        groups.today.push(conv);
      } else if (convDate.toDateString() === yesterday.toDateString()) {
        groups.yesterday.push(conv);
      } else if (convDate > lastWeek) {
        groups.lastWeek.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };

  const groupedConversations = groupConversations(filteredConversations);

  if (!sidebarOpen) {
    return (
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
    );
  }

  const ConversationGroup = ({ title, items }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <h3 className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
        {items.map(conv => (
          <div
            key={conv.id}
            className={`group relative flex items-center gap-3 px-3 py-2 mx-2 rounded-lg cursor-pointer transition-colors duration-150
              ${activeConversationId === conv.id
                ? 'bg-[#2f2f2f]'
                : 'hover:bg-[#2f2f2f]/50'
              }`}
            onClick={() => selectConversation(conv.id)}
            onMouseEnter={() => setHoveredId(conv.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="flex-1 truncate text-sm text-gray-200">
              {conv.title}
            </span>
            {(hoveredId === conv.id || activeConversationId === conv.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#3f3f3f] rounded transition-opacity"
              >
                <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-400" />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
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
        <Button
          variant="ghost"
          size="icon"
          onClick={createNewConversation}
          className="text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-lg"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Model Selector */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between text-white hover:bg-[#2f2f2f] font-medium text-base"
            >
              <span>{selectedModel.name}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[230px] bg-[#2f2f2f] border-[#3f3f3f]" align="start">
            {models.map(model => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => setSelectedModel(model)}
                className={`flex flex-col items-start py-3 cursor-pointer ${selectedModel.id === model.id ? 'bg-[#3f3f3f]' : ''}`}
              >
                <span className="text-white font-medium">{model.name}</span>
                <span className="text-xs text-gray-400">{model.description}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search */}
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

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-1">
        <ConversationGroup title="Heute" items={groupedConversations.today} />
        <ConversationGroup title="Gestern" items={groupedConversations.yesterday} />
        <ConversationGroup title="Letzte 7 Tage" items={groupedConversations.lastWeek} />
        <ConversationGroup title="Älter" items={groupedConversations.older} />
        {filteredConversations.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            {searchQuery ? 'Keine Chats gefunden' : 'Noch keine Unterhaltungen'}
          </div>
        )}
      </ScrollArea>

      {/* User Section */}
      <div className="border-t border-[#2f2f2f] p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-200 hover:bg-[#2f2f2f] py-3"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
              <span className="text-sm">Benutzer</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[230px] bg-[#2f2f2f] border-[#3f3f3f]" align="start" side="top">
            <DropdownMenuItem className="text-gray-200 cursor-pointer">
              <Settings className="h-4 w-4 mr-2" />
              Einstellungen
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#3f3f3f]" />
            <DropdownMenuItem className="text-gray-200 cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Sidebar;
