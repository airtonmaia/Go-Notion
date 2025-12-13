
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import NoteList from './components/NoteList';
import NotebookList from './components/NotebookList';
import Editor from './components/Editor';
import Auth from './components/Auth';
import AccountSettings from './components/AccountSettings';
import TasksView from './components/TasksView';
import ShareModal from './components/ShareModal';
import { Note, Notebook, TaskItem, ViewMode } from './types';
import * as StorageService from './services/storage';
import { supabase } from './services/supabase';
import { Coffee, Menu, Loader2, Tag } from 'lucide-react';
import { Button } from './components/ui/Button';

const extractTasksFromNote = (note: Note): TaskItem[] => {
  const tasks: TaskItem[] = [];
  const htmlContent = note.content || '';
  const taskRegex = /<li[^>]*data-type="taskItem"[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  let index = 0;

  while ((match = taskRegex.exec(htmlContent)) !== null) {
    const rawLi = match[0] || '';
    const inner = match[1] || '';
    const text = inner
      .replace(/<input[^>]*>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;

    const checked = /data-checked=["']?(true|checked)["']?/i.test(rawLi);
    tasks.push({
      id: `${note.id}-task-${index}`,
      text,
      checked,
      noteId: note.id,
      noteTitle: note.title || 'Sem titulo',
      updatedAt: note.updatedAt,
    });
    index += 1;
  }

  if (tasks.length === 0) {
    const mdRegex = /-\s*\[( |x|X)\]\s+(.*)/g;
    let mdMatch;
    let mdIndex = 0;
    while ((mdMatch = mdRegex.exec(note.content || '')) !== null) {
      const checked = (mdMatch[1] || '').toLowerCase() === 'x';
      const text = (mdMatch[2] || '').trim();
      if (!text) continue;
      tasks.push({
        id: `${note.id}-md-${mdIndex}`,
        text,
        checked,
        noteId: note.id,
        noteTitle: note.title || 'Sem titulo',
        updatedAt: note.updatedAt,
      });
      mdIndex += 1;
    }
  }

  return tasks;
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [notes, setNotes] = useState<Note[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.EMPTY);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes', 'shortcuts', 'shared', 'trash', 'tasks', 'notebooks', or 'tag:TagName'
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotebookShareModal, setShowNotebookShareModal] = useState(false);
  const [noteOrderMap, setNoteOrderMap] = useState<Record<string, string[]>>(() => {
    try {
      const stored = localStorage.getItem('noteOrderMap');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return false; // default: white/light theme
  });

  // Derived state: Unique tags from all notes
  const allTags = Array.from(new Set(notes.flatMap(note => note.tags || []))).sort();
  const tasksFromNotes: TaskItem[] = useMemo(
    () => notes.flatMap(extractTasksFromNote),
    [notes]
  );

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
        const loadedShared = await StorageService.getSharedNotes();
        setNotes(loadedNotes);
        setNotebooks(loadedNotebooks);
        setSharedNotes(loadedShared);
      }
    };
    loadData();
  }, [session]);

  const refreshData = async () => {
    if (session) {
        const loadedNotes = await StorageService.getNotes();
        const loadedNotebooks = await StorageService.getNotebooks();
        const loadedShared = await StorageService.getSharedNotes();
        setNotes(loadedNotes);
        setNotebooks(loadedNotebooks);
        setSharedNotes(loadedShared);
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

  const handleCreateNotebook = async (name: string, parentId: string | null = null) => {
    await StorageService.createNotebook(name, parentId);
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
    if (tab === 'shared') {
      setActiveNotebookId(null);
    }
  };

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    setViewMode(ViewMode.EDITOR);
  };

  const handleSelectNoteFromTasks = (id: string) => {
    setSelectedNoteId(id);
    setViewMode(ViewMode.EDITOR);
    setActiveTab('notes');
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleCreateTaskFromTasks = async () => {
    await handleNewNote();
    setActiveTab('notes');
  };

  const handleReorderNotes = (notebookId: string, sourceId: string, targetId: string) => {
    const currentOrder = noteOrderMap[notebookId] || applyOrder(notes.filter(n => n.notebookId === notebookId)).map(n => n.id);
    const sourceIndex = currentOrder.indexOf(sourceId);
    const targetIndex = currentOrder.indexOf(targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const updated = [...currentOrder];
    updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, sourceId);
    setNoteOrderMap(prev => ({ ...prev, [notebookId]: updated }));
  };

  const handleMoveNote = async (noteId: string, targetNotebookId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || note.notebookId === targetNotebookId) return;
    const updatedNote = { ...note, notebookId: targetNotebookId, updatedAt: Date.now() };
    setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
    await StorageService.saveNote(updatedNote);

    // Remove from old order and add to top of new
    setNoteOrderMap(prev => {
      const next = { ...prev };
      const oldList = (next[note.notebookId] || []).filter(id => id !== noteId);
      if (oldList.length > 0) next[note.notebookId] = oldList;
      const newList = next[targetNotebookId] ? [noteId, ...next[targetNotebookId].filter(id => id !== noteId)] : [noteId];
      next[targetNotebookId] = newList;
      return next;
    });
    setSelectedNoteId(noteId);
    setActiveNotebookId(targetNotebookId);
    setActiveTab('notes');
  };

  // Handle shared link token (?share=TOKEN)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get('share');
    if (!shareToken) return;
    (async () => {
      const { notes: sharedFromToken, notebookId: tokenNotebook } = await StorageService.getSharedByToken(shareToken);
      if (sharedFromToken.length > 0) {
        setSharedNotes(sharedFromToken);
        setActiveTab('shared');
        setSelectedNoteId(sharedFromToken[0].id);
        if (tokenNotebook) {
          setActiveNotebookId(tokenNotebook);
        } else {
          setActiveNotebookId(null);
        }
      }
    })();
  }, []);

  const updateTaskInNote = (note: Note, taskId: string, checked: boolean): Note => {
    let content = note.content || '';
    const now = Date.now();

    if (taskId.includes('-task-')) {
      const targetIndex = parseInt(taskId.split('-task-')[1] || '0', 10);
      let index = 0;
      content = content.replace(/<li[^>]*data-type="taskItem"[^>]*>[\s\S]*?<\/li>/gi, (block) => {
        if (index !== targetIndex) {
          index += 1;
          return block;
        }
        index += 1;

        let updated = block.replace(/data-checked=["'][^"']*["']/i, '');
        updated = updated.replace(/^<li([^>]*)>/i, (_m, attrs) => {
          const cleanAttrs = (attrs || '').trim().replace(/data-checked=["'][^"']*["']/i, '').trim();
          const prefix = cleanAttrs ? ` ${cleanAttrs}` : '';
          return `<li${prefix} data-checked="${checked}">`;
        });
        updated = updated.replace(/<input([^>]*?)\schecked(?:=["']checked["'])?([^>]*)>/i, '<input$1$2>');
        updated = updated.replace(/<input([^>]*)>/i, `<input$1${checked ? ' checked' : ''}>`);
        return updated;
      });
    } else if (taskId.includes('-md-')) {
      const targetIndex = parseInt(taskId.split('-md-')[1] || '0', 10);
      let index = 0;
      content = content.replace(/-\s*\[( |x|X)\]\s+(.*)/g, (match, mark, text) => {
        if (index !== targetIndex) {
          index += 1;
          return match;
        }
        index += 1;
        const newMark = checked ? 'x' : ' ';
        return `- [${newMark}] ${text}`;
      });
    }

    return {
      ...note,
      content,
      updatedAt: now,
    };
  };

  const handleToggleTaskStatus = async (taskId: string, checked: boolean) => {
    const noteId = taskId.includes('-task-')
      ? taskId.split('-task-')[0]
      : taskId.includes('-md-')
        ? taskId.split('-md-')[0]
        : null;
    if (!noteId) return;

    const target = notes.find(n => n.id === noteId);
    if (!target) return;

    const updatedNote = updateTaskInNote(target, taskId, checked);
    setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
    await StorageService.saveNote(updatedNote);
  };

  const handleBackToList = () => {
    setSelectedNoteId(null);
    setViewMode(ViewMode.EMPTY);
  };

  useEffect(() => {
    localStorage.setItem('noteOrderMap', JSON.stringify(noteOrderMap));
  }, [noteOrderMap]);

  const applyOrder = (noteList: Note[]) => {
    return [...noteList].sort((a, b) => {
      const order = noteOrderMap[a.notebookId] || [];
      const idxA = order.indexOf(a.id);
      const idxB = order.indexOf(b.id);
      if (idxA !== -1 || idxB !== -1) {
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      }
      return b.updatedAt - a.updatedAt;
    });
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

  const selectedNote = (activeTab === 'shared' ? sharedNotes : notes).find(n => n.id === selectedNoteId);
  const visibleNotes = activeTab === 'shared' ? applyOrder(filterNotes(sharedNotes)) : applyOrder(filterNotes(notes));
  
  const activeNotebookObj = activeNotebookId ? notebooks.find(n => n.id === activeNotebookId) : null;
  
  // Determine header title
  let activeTitle = 'Todas as Notas';
  if (activeTab === 'shortcuts') activeTitle = 'Favoritos';
  else if (activeTab.startsWith('tag:')) activeTitle = `Etiqueta: ${activeTab.replace('tag:', '')}`;
  else if (activeNotebookId && activeNotebookObj) activeTitle = `${activeNotebookObj.name}`;

  return (
    <>
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
        {activeTab === 'tasks' ? (
          <TasksView
            tasks={tasksFromNotes}
            onSelectNote={handleSelectNoteFromTasks}
            onCreateTask={handleCreateTaskFromTasks}
            onToggleTask={handleToggleTaskStatus}
          />
        ) : (
          <>
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
                  onDropNote={handleMoveNote}
                />
              ) : (
                <NoteList 
                  notes={visibleNotes}
                  selectedNoteId={selectedNoteId} 
                  onSelectNote={handleSelectNote}
                  searchQuery={searchQuery}
                  onOpenMenu={() => setIsMobileMenuOpen(true)}
                  notebookName={activeTitle}
                  onShareNotebook={activeNotebookId ? () => setShowNotebookShareModal(true) : undefined}
                  notebookId={activeNotebookId || undefined}
                  onReorderNote={activeNotebookId ? handleReorderNotes : undefined}
                  onMoveNote={handleMoveNote}
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
                            ? "A lista esta vazia ou nenhuma nota selecionada."
                            : "Selecione uma nota ou crie uma nova para comecar."}
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
          </>
        )}
      </div>
    </div>

    {activeNotebookId && (
      <ShareModal
        open={showNotebookShareModal}
        onClose={() => setShowNotebookShareModal(false)}
        resourceId={activeNotebookId}
        resourceType="notebook"
        title={activeNotebookObj?.name || ''}
      />
    )}
    </>
  );
};

export default App;
