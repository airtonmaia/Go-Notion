
import React, { useState, useEffect } from 'react';
import { Search, Star, Trash2, PlusCircle, Settings, BookA, ChevronRight, ChevronDown, Plus, Moon, Sun, LogOut, Tag, PlusSquare, CheckSquare } from 'lucide-react';
import { Notebook } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Dialog, DialogFooter } from './ui/Dialog';
import { cn } from './ui/utils';
import * as AuthService from '../services/auth';

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
  tags?: string[];
  onSelectTag?: (tag: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onOpenSettings: () => void;
}

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
  tags = [],
  onSelectTag,
  isDarkMode,
  toggleTheme,
  onOpenSettings
}) => {
  const [isNotebooksExpanded, setIsNotebooksExpanded] = useState(true);
  const [isTagsExpanded, setIsTagsExpanded] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [userEmail, setUserEmail] = useState('Usuário');
  
  const [expandedNotebooks, setExpandedNotebooks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    AuthService.getProfile().then((profile) => {
      if (profile) {
        setUserEmail(profile.full_name || profile.email);
      }
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
    { id: 'notes', label: 'Notas Recentes', icon: BookA },
    { id: 'shortcuts', label: 'Favoritos', icon: Star },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNotebookName.trim()) {
      const parent = selectedParentId === '' ? null : selectedParentId;
      onCreateNotebook(newNotebookName, '📓', parent); 
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
  
  const handleSelectTagInternal = (tag: string) => {
    if (onSelectTag) onSelectTag(tag);
    if (window.innerWidth < 768) onClose();
  };

  const renderNotebookTree = (parentId: string | null = null, depth: number = 0) => {
    const children = notebooks
      .filter(nb => (nb.parentId || null) === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

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
                  "w-full flex items-center gap-1.5 pr-2 py-1.5 rounded-sm text-sm transition-colors group relative select-none cursor-pointer",
                  activeNotebookId === nb.id 
                    ? "bg-secondary text-secondary-foreground font-medium" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
                style={{ paddingLeft: `${depth * 18 + 12}px` }} 
                onClick={() => handleSelectNotebookInternal(nb.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasChildren) toggleNotebookExpand(nb.id, e);
                  }}
                  className={cn(
                    "p-0.5 rounded hover:bg-background/20 text-muted-foreground flex-shrink-0 transition-transform w-5 h-5 flex items-center justify-center",
                    !hasChildren && "invisible pointer-events-none"
                  )}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <BookA size={16} className={cn("flex-shrink-0", activeNotebookId === nb.id ? "text-primary" : "text-muted-foreground")} />

                <span className="truncate flex-1">{nb.name}</span>

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
        
        {/* Header - Clickable for Settings */}
        <button 
          onClick={() => {
            onOpenSettings();
            if (window.innerWidth < 768) onClose();
          }}
          className="p-3 flex items-center gap-2 h-14 border-b w-full hover:bg-accent/50 transition-colors text-left"
        >
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
              {userEmail.charAt(0).toUpperCase()}
          </div>
          <span className="truncate text-sm font-semibold flex-1" title={userEmail}>{userEmail}</span>
          <Settings size={14} className="text-muted-foreground" />
        </button>

        {/* New Note Button */}
        <div className="px-3 py-4">
          <Button 
            onClick={onNewNote}
            className="w-full justify-start shadow-sm"
            variant="default"
          >
            <PlusCircle size={16} className="mr-2" />
            Nova Nota
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin scrollbar-thumb-muted">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className="w-full justify-start h-8 text-sm font-medium"
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 768) onClose();
              }}
            >
              <item.icon size={16} className="mr-2 text-muted-foreground" />
              {item.label}
            </Button>
          ))}

          {/* Notebooks Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between group px-2 py-1 mb-1">
              <button 
                onClick={() => setIsNotebooksExpanded(!isNotebooksExpanded)}
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wide flex-1 text-left"
              >
                {isNotebooksExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Cadernos
              </button>
            </div>

            {isNotebooksExpanded && (
              <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                 {renderNotebookTree(null)}
                 
                 {/* Standardized New Notebook Button */}
                 <button
                    onClick={() => {
                      setSelectedParentId('');
                      setShowCreateModal(true);
                    }}
                    className="w-full flex items-center gap-2 pl-[34px] py-1.5 text-sm rounded-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 hover:bg-muted/50 transition-colors"
                 >
                   <Plus size={16} />
                   Novo Caderno
                 </button>
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between group px-2 py-1 mb-1">
              <button 
                onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wide flex-1 text-left"
              >
                {isTagsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Etiquetas
              </button>
            </div>

            {isTagsExpanded && (
              <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                {tags.map(tag => (
                   <div 
                      key={tag}
                      onClick={() => handleSelectTagInternal(tag)}
                      className={cn(
                        "w-full flex items-center gap-2 pl-[34px] pr-2 py-1.5 rounded-sm text-sm transition-colors cursor-pointer",
                        activeTab === `tag:${tag}`
                          ? "bg-secondary text-secondary-foreground font-medium" 
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <Tag size={16} />
                      <span className="truncate">{tag}</span>
                   </div>
                ))}
                 
                 {/* Standardized New Tag Button */}
                 <button
                    onClick={() => alert("Crie uma nota e adicione tags a ela para vê-las aqui.")}
                    className="w-full flex items-center gap-2 pl-[34px] py-1.5 text-sm rounded-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 hover:bg-muted/50 transition-colors"
                 >
                   <Plus size={16} />
                   Nova Etiqueta
                 </button>
              </div>
            )}
          </div>
          
           <div className="mt-4 pt-4 border-t">
             <Button
                variant={activeTab === 'trash' ? "secondary" : "ghost"}
                className="w-full justify-start h-8 text-sm"
                onClick={() => {
                  setActiveTab('trash');
                  if (window.innerWidth < 768) onClose();
                }}
              >
                <Trash2 size={16} className="mr-2 text-muted-foreground" />
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
                      {nb.name}
                    </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3 text-muted-foreground pointer-events-none" />
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
