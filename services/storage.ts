
import { supabase } from './supabase';
import { Note, Notebook, NoteRevision } from '../types';

const generateId = () => crypto.randomUUID();

// --- MAPPERS ---

const mapNoteFromDB = (dbNote: any): Note => ({
  id: dbNote.id,
  title: dbNote.title || '',
  content: dbNote.content || '',
  excerpt: dbNote.excerpt || '',
  tags: dbNote.tags || [],
  notebookId: dbNote.notebook_id,
  isFavorite: dbNote.is_favorite || false,
  updatedAt: new Date(dbNote.updated_at).getTime(),
  createdAt: new Date(dbNote.created_at).getTime(),
});

const mapNoteToDB = (note: Note, userId: string) => ({
  id: note.id,
  user_id: userId,
  title: note.title,
  content: note.content,
  excerpt: note.excerpt,
  tags: note.tags,
  notebook_id: note.notebookId,
  is_favorite: note.isFavorite || false,
  updated_at: new Date(note.updatedAt).toISOString(),
  created_at: new Date(note.createdAt).toISOString(),
});

const mapNotebookFromDB = (dbNotebook: any): Notebook => ({
  id: dbNotebook.id,
  name: dbNotebook.name,
  emoji: dbNotebook.emoji,
  parentId: dbNotebook.parent_id,
});

const mapNotebookToDB = (notebook: Notebook, userId: string) => ({
  id: notebook.id,
  user_id: userId,
  name: notebook.name,
  emoji: notebook.emoji,
  parent_id: notebook.parentId,
});

// --- NOTES ---

export const getNotes = async (): Promise<Note[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id) // Security check
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error.message);
    return [];
  }
  
  return data ? data.map(mapNoteFromDB) : [];
};

export const saveNote = async (note: Note): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('notes')
    .upsert(mapNoteToDB(note, user.id));
    
  if (error) {
    // Log the full error message for debugging
    console.error('Error saving note to Supabase:', JSON.stringify(error, null, 2));
  }
};

export const deleteNote = async (id: string): Promise<void> => {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) console.error('Error deleting note from Supabase:', error.message);
};

// --- REVISIONS (HISTORY) ---

export const getNoteHistory = async (noteId: string): Promise<NoteRevision[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Assuming 'note_revisions' table exists (see SQL instructions)
  const { data, error } = await supabase
    .from('note_revisions')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching revisions:', error.message);
    return [];
  }

  return data.map((rev: any) => ({
    id: rev.id,
    noteId: rev.note_id,
    title: rev.title || '',
    content: rev.content || '',
    createdAt: rev.created_at
  }));
};

// --- NOTEBOOKS ---

export const getNotebooks = async (): Promise<Notebook[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
      .from('notebooks')
      .select('*')
      .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching notebooks:', error.message);
    return [];
  }
  
  if (!data || data.length === 0) {
    // Create default notebook for new user
    const defaultNb: Notebook = { id: generateId(), name: 'Primeiro Caderno', emoji: '📘', parentId: null };
    await createNotebook(defaultNb.name, defaultNb.emoji, null);
    return [defaultNb];
  }
  
  return data.map(mapNotebookFromDB);
};

export const createNotebook = async (name: string, emoji: string = '📓', parentId: string | null = null): Promise<Notebook> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const newNotebook: Notebook = {
    id: generateId(),
    name: name.trim() || 'Novo Caderno',
    emoji: emoji,
    parentId: parentId
  };

  const { error } = await supabase
    .from('notebooks')
    .insert(mapNotebookToDB(newNotebook, user.id));
    
  if (error) {
    console.error('Error creating notebook in Supabase:', error.message);
    throw error;
  }

  return newNotebook;
};

export const deleteNotebook = async (id: string): Promise<void> => {
  const { error } = await supabase
      .from('notebooks')
      .delete()
      .eq('id', id);
        
  if (error) console.error('Error deleting notebook in Supabase:', error.message);
};

export const createNote = async (notebookId: string): Promise<Note> => {
  const newNote: Note = {
    id: generateId(),
    title: '',
    content: '',
    excerpt: '',
    tags: [],
    notebookId,
    isFavorite: false,
    updatedAt: Date.now(),
    createdAt: Date.now(),
  };
  
  await saveNote(newNote);
  return newNote;
};
