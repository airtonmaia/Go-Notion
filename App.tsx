
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import NoteList from './components/NoteList';
import NotebookList from './components/NotebookList';
import Editor from './components/Editor';
import Auth from './components/Auth';
import AccountSettings from './components/AccountSettings';
import { Note, Notebook, ViewMode } from './types';
import * as StorageService from './services/storage';
import { supabase } from './services/supabase';
import { Coffee, Menu, Loader2, Tag } from 'lucide-react';
import { Button } from './components/ui/Button';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [notes, setNotes] = useState<Note[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.EMPTY);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes', 'shortcuts', 'trash', 'notebooks', or 'tag:TagName'
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Derived state: Unique tags from all notes
  const allTags = Array.from(new Set(notes.flatMap(note => note.tags || []))).sort();

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingAuth(false);
      // Reset state on logout
      if (!session) {
        setNotes([]);
        setNotebooks([]);
        setSelectedNoteId(null);
        setActiveNotebookId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Carregamento de Dados (apenas se logado)
  useEffect(() => {
    const loadData = async () => {
      if (session) {
        const loadedNotes = await StorageService.getNotes();
        const loadedNotebooks = await StorageService.getNotebooks();
        setNotes(loadedNotes);
        setNotebooks(loadedNotebooks);
      }
    };
    loadData();
  }, [session]);

  const refreshData = async () => {
    if (session) {
        const loadedNotes = await StorageService.getNotes();
        const loadedNotebooks = await StorageService.getNotebooks();
        setNotes(loadedNotes);
        setNotebooks(loadedNotebooks);
    }
  };

  const handleNewNote = async () => {
    const targetNotebookId = activeNotebookId || (notebooks.length > 0 ? notebooks[0].id : null);
    
    // Safety check
    if (!targetNotebookId) {
        alert("Crie um caderno primeiro.");
        return;
    }

    const newNote = await StorageService.createNote(targetNotebookId);
    
    // If currently filtering by a tag, auto-add that tag to the new note
    if (activeTab.startsWith('tag:')) {
      const tagToApply = activeTab.replace('tag:', '');
      newNote.tags = [tagToApply];
      await StorageService.saveNote(newNote); // Update immediately
    }

    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
    setViewMode(ViewMode.EDITOR);
    // Keep the current tab active so the user stays in context
    setIsMobileMenuOpen(false);
  };

  const handleUpdateNote = (updatedNote: Note) => {
    StorageService.saveNote(updatedNote);
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta nota?")) {
      StorageService.deleteNote(id);
      const remaining = notes.filter(n => n.id !== id);
      setNotes(remaining);
      
      // Select next logic
      if (remaining.length > 0) {
           // Try to find a note in the current view context
           const visible = filterNotes(remaining);
           
           if (visible.length > 0) {
             setSelectedNoteId(visible[0].id);
           } else {
             setSelectedNoteId(null);
             setViewMode(ViewMode.EMPTY);
           }
      } else {
          setSelectedNoteId(null);
          setViewMode(ViewMode.EMPTY);
      }
    }
  };

  const handleCreateNotebook = async (name: string, emoji: string = '📓', parentId: string | null = null) => {
    await StorageService.createNotebook(name, emoji, parentId);
    refreshData();
  };

  const handleDeleteNotebook = async (id: string) => {
    await StorageService.deleteNotebook(id);
    refreshData();
    if (activeNotebookId === id) {
      setActiveNotebookId(null);
      setActiveTab('notes');
    }
  };

  const handleSelectNotebook = (id: string) => {
    setActiveNotebookId(id);
    setActiveTab('notes');
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleSelectTag = (tag: string) => {
    setActiveTab(`tag:${tag}`);
    setActiveNotebookId(null);
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleSidebarTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'notes') {
      setActiveNotebookId(null);
    }
  };

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    setViewMode(ViewMode.EDITOR);
  };

  const handleBackToList = () => {
    setSelectedNoteId(null);
    setViewMode(ViewMode.EMPTY);
  };

  // Helper to filter notes based on current state
  const filterNotes = (noteList: Note[]) => {
    return noteList.filter(n => {
      let matchesContext = true;
      
      if (activeTab === 'shortcuts') {
        matchesContext = n.isFavorite === true;
      } else if (activeTab === 'notes') {
         if (activeNotebookId) {
           matchesContext = n.notebookId === activeNotebookId;
         }
      } else if (activeTab === 'trash') {
         matchesContext = false; 
      } else if (activeTab.startsWith('tag:')) {
         const tag = activeTab.replace('tag:', '');
         matchesContext = n.tags && n.tags.includes(tag);
      }
  
      const matchesSearch = searchQuery 
        ? (n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
        
      return matchesContext && matchesSearch;
    });
  };

  // Loading Screen
  if (loadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Auth Screen
  if (!session) {
    return <Auth />;
  }

  // Account Settings View
  if (viewMode === ViewMode.ACCOUNT) {
    return (
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
        <Sidebar 
          onNewNote={handleNewNote} 
          activeTab={activeTab}
          setActiveTab={handleSidebarTabChange}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          notebooks={notebooks}
          activeNotebookId={activeNotebookId}
          onSelectNotebook={handleSelectNotebook}
          onCreateNotebook={handleCreateNotebook}
          tags={allTags}
          onSelectTag={handleSelectTag}
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
          onOpenSettings={() => setViewMode(ViewMode.ACCOUNT)}
        />
        <div className="flex-1 h-full relative">
            <AccountSettings onBack={handleBackToList} />
        </div>
      </div>
    );
  }

  const selectedNote = notes.find(n => n.id === selectedNoteId);
  const visibleNotes = filterNotes(notes);
  
  const activeNotebookObj = activeNotebookId ? notebooks.find(n => n.id === activeNotebookId) : null;
  
  // Determine header title
  let activeTitle = 'Todas as Notas';
  if (activeTab === 'shortcuts') activeTitle = 'Favoritos';
  else if (activeTab.startsWith('tag:')) activeTitle = `Etiqueta: ${activeTab.replace('tag:', '')}`;
  else if (activeNotebookId && activeNotebookObj) activeTitle = `${activeNotebookObj.emoji || ''} ${activeNotebookObj.name}`;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <Sidebar 
        onNewNote={handleNewNote} 
        activeTab={activeTab}
        setActiveTab={handleSidebarTabChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        notebooks={notebooks}
        activeNotebookId={activeNotebookId}
        onSelectNotebook={handleSelectNotebook}
        onCreateNotebook={handleCreateNotebook}
        tags={allTags}
        onSelectTag={handleSelectTag}
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        onOpenSettings={() => setViewMode(ViewMode.ACCOUNT)}
      />

      <div className="flex-1 flex h-full w-full">
        <div className={`
          flex-col h-full bg-background border-r
          ${selectedNoteId && activeTab !== 'notebooks' ? 'hidden md:flex md:w-80' : 'flex w-full md:w-80'}
          flex-shrink-0
        `}>
          {activeTab === 'notebooks' ? (
            <NotebookList 
              notebooks={notebooks}
              onCreateNotebook={handleCreateNotebook}
              onDeleteNotebook={handleDeleteNotebook}
              onSelectNotebook={handleSelectNotebook}
              onOpenMenu={() => setIsMobileMenuOpen(true)}
            />
          ) : (
            <NoteList 
              notes={visibleNotes}
              selectedNoteId={selectedNoteId} 
              onSelectNote={handleSelectNote}
              searchQuery={searchQuery}
              onOpenMenu={() => setIsMobileMenuOpen(true)}
              notebookName={activeTitle}
            />
          )}
        </div>

        <div className={`flex-1 h-full bg-background relative 
          ${(!selectedNoteId && activeTab !== 'notebooks') ? 'hidden md:flex' : ''}
          ${(activeTab === 'notebooks') ? 'hidden md:flex' : ''}
          ${(selectedNoteId && activeTab !== 'notebooks') ? 'flex w-full' : ''}
        `}>
          {viewMode === ViewMode.EDITOR && selectedNote ? (
            <Editor 
              note={selectedNote} 
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
              onBack={handleBackToList}
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center bg-muted/20 text-muted-foreground p-8 text-center">
               <div className="md:hidden w-full absolute top-4 left-4">
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                    <Menu size={24} />
                  </Button>
               </div>
               
               {activeTab === 'notebooks' ? (
                 <>
                   <div className="bg-primary/10 p-6 rounded-full mb-6">
                      <Coffee size={64} className="text-primary" />
                   </div>
                   <h1 className="text-2xl font-bold text-foreground mb-2">Gerencie seus Cadernos</h1>
                   <p className="max-w-md">
                     Selecione um caderno na barra lateral ou na lista para ver suas notas.
                   </p>
                 </>
               ) : (
                 <>
                   <div className="bg-primary/10 p-6 rounded-full mb-6">
                      <Coffee size={64} className="text-primary" />
                   </div>
                   <h1 className="text-2xl font-bold text-foreground mb-2">Bem-vindo ao ForeverNote</h1>
                   <p className="max-w-md mb-8">
                     {activeNotebookId || activeTab === 'shortcuts' || activeTab.startsWith('tag:')
                        ? "A lista está vazia ou nenhuma nota selecionada." 
                        : "Selecione uma nota ou crie uma nova para começar."}
                   </p>
                   <Button 
                      onClick={handleNewNote}
                      size="lg"
                      className="gap-2"
                   >
                     Criar Nova Nota
                   </Button>
                 </>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
