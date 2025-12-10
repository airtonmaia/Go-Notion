
import React, { useState, useEffect } from 'react';
import { Search, Star, Trash2, PlusCircle, Settings, Book, ChevronRight, ChevronDown, Plus, Moon, Sun, X, LogOut } from 'lucide-react';
import { Notebook } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Dialog, DialogFooter } from './ui/Dialog';
import { cn } from './ui/utils';
import * as AuthService from '../services/auth';
import { supabase } from '../services/supabase';

interface SidebarProps {
  onNewNote: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isOpen: boolean;
  onClose: () => void;
  notebooks: Notebook[];
  activeNotebookId: string | null;
  onSelectNotebook: (id: string) => void;
  onCreateNotebook: (name: string, emoji: string, parentId: string | null) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const EMOJI_OPTIONS = ['📓', '📘', '💼', '🏡', '✈️', '🍕', '💡', '🎓', '🚀', '🎨', '❤️', '✅'];

const Sidebar: React.FC<SidebarProps> = ({ 
  onNewNote, 
  activeTab, 
  setActiveTab, 
  searchQuery, 
  setSearchQuery,
  isOpen,
  onClose,
  notebooks,
  activeNotebookId,
  onSelectNotebook,
  onCreateNotebook,
  isDarkMode,
  toggleTheme
}) => {
  const [isNotebooksExpanded, setIsNotebooksExpanded] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [userEmail, setUserEmail] = useState('Usuário');
  
  const [expandedNotebooks, setExpandedNotebooks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  // Auto-expand parents when activeNotebookId changes
  useEffect(() => {
    if (activeNotebookId) {
      const expandParents = (currentId: string) => {
        const current = notebooks.find(n => n.id === currentId);
        if (current && current.parentId) {
          setExpandedNotebooks(prev => ({ ...prev, [current.parentId!]: true }));
          expandParents(current.parentId);
        }
      };
      expandParents(activeNotebookId);
      setIsNotebooksExpanded(true); // Ensure the main section is open
    }
  }, [activeNotebookId, notebooks]);

  const toggleNotebookExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNotebooks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSignOut = async () => {
    await AuthService.signOut();
  };

  const menuItems = [
    { id: 'notes', label: 'Notas', icon: Book },
    { id: 'shortcuts', label: 'Atalhos', icon: Star },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNotebookName.trim()) {
      const parent = selectedParentId === '' ? null : selectedParentId;
      onCreateNotebook(newNotebookName, selectedEmoji, parent);
      setNewNotebookName('');
      setSelectedParentId('');
      setShowCreateModal(false);
      setIsNotebooksExpanded(true);
      if (parent) {
        setExpandedNotebooks(prev => ({ ...prev, [parent]: true }));
      }
    }
  };

  const handleSelectNotebookInternal = (id: string) => {
    onSelectNotebook(id);
    if (window.innerWidth < 768) onClose();
  };

  const renderNotebookTree = (parentId: string | null = null, depth: number = 0) => {
    const children = notebooks
      .filter(nb => (nb.parentId || null) === parentId)
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    if (children.length === 0) return null;

    return (
      <ul className="space-y-0.5">
        {children.map((nb) => {
          const hasChildren = notebooks.some(child => child.parentId === nb.id);
          const isExpanded = expandedNotebooks[nb.id];

          return (
            <li key={nb.id}>
              <div 
                className={cn(
                  "w-full flex items-center gap-1 pr-2 py-1 rounded-sm text-sm transition-colors group relative select-none",
                  activeNotebookId === nb.id 
                    ? "bg-accent text-accent-foreground font-medium" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                style={{ paddingLeft: `${depth * 16 + 12}px` }} 
              >
                <button
                  onClick={(e) => hasChildren ? toggleNotebookExpand(nb.id, e) : undefined}
                  className={cn(
                    "p-0.5 rounded hover:bg-background/20 text-muted-foreground flex-shrink-0 transition-transform",
                    !hasChildren && "opacity-0 cursor-default"
                  )}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <button 
                  onClick={() => handleSelectNotebookInternal(nb.id)}
                  className="flex items-center gap-2 flex-1 text-left min-w-0 py-0.5"
                >
                  <span className="text-base leading-none flex-shrink-0">{nb.emoji || '📓'}</span>
                  <span className="truncate">{nb.name}</span>
                </button>

                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedParentId(nb.id);
                    setShowCreateModal(true);
                  }}
                  title="Criar subcaderno"
                >
                  <Plus size={12} />
                </Button>
              </div>

              {hasChildren && isExpanded && renderNotebookTree(nb.id, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-all"
          onClick={onClose}
        />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-card text-card-foreground flex flex-col h-full border-r transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64",
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between h-14 border-b">
          <div className="flex items-center gap-2 font-semibold overflow-hidden">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                {userEmail.charAt(0).toUpperCase()}
            </div>
            <span className="truncate text-sm" title={userEmail}>{userEmail}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <X size={18} />
          </Button>
        </div>

        {/* New Note Button */}
        <div className="px-3 py-4">
          <Button 
            onClick={onNewNote}
            className="w-full rounded-full shadow-sm"
          >
            <PlusCircle size={16} className="mr-2" />
            Nova Nota
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 768) onClose();
              }}
            >
              <item.icon size={16} className="mr-2" />
              {item.label}
            </Button>
          ))}

          {/* Notebooks Section */}
          <div className="mt-6 pt-2">
            <div className="flex items-center justify-between group px-2 py-1 mb-1">
              <button 
                onClick={() => setIsNotebooksExpanded(!isNotebooksExpanded)}
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wide flex-1 text-left"
              >
                {isNotebooksExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Cadernos
              </button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 opacity-0 group-hover:opacity-100"
                onClick={() => {
                  setSelectedParentId('');
                  setShowCreateModal(true);
                }}
              >
                <Plus size={14} />
              </Button>
            </div>

            {isNotebooksExpanded && (
              <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                 <Button
                   variant={activeTab === 'notebooks' && !activeNotebookId ? "secondary" : "ghost"}
                   className="w-full justify-start pl-6 mb-1 h-8"
                   onClick={() => {
                     setActiveTab('notebooks');
                     if (window.innerWidth < 768) onClose();
                   }}
                 >
                    <Book size={14} className="mr-2 text-muted-foreground" />
                    Todos os cadernos
                 </Button>
                 {renderNotebookTree(null)}
              </div>
            )}
          </div>
          
           <div className="mt-2">
             <Button
                variant={activeTab === 'trash' ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab('trash');
                  if (window.innerWidth < 768) onClose();
                }}
              >
                <Trash2 size={16} className="mr-2" />
                Lixeira
              </Button>
           </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t bg-background space-y-2">
           <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar..." 
              className="pl-8 h-9 bg-muted/50 border-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSignOut} title="Sair">
              <LogOut size={16} className="mr-2" />
              Sair
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={toggleTheme}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Create Notebook Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal} title="Criar novo caderno">
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Nome</label>
            <Input
              autoFocus
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              placeholder="Ex: Projetos"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Localização</label>
            <div className="relative">
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
              >
                <option value="">Raiz (Principal)</option>
                {notebooks.map(nb => (
                    <option key={nb.id} value={nb.id}>
                      {nb.emoji} {nb.name}
                    </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Ícone</label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={cn(
                    "h-9 w-9 flex items-center justify-center rounded-md transition-all text-lg",
                    selectedEmoji === emoji 
                      ? "bg-primary text-primary-foreground ring-2 ring-offset-2 ring-ring" 
                      : "hover:bg-muted"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={!newNotebookName.trim()}>Criar Caderno</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
};

export default Sidebar;
