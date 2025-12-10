
import { supabase } from './supabase';
import { Note, Notebook } from '../types';

const generateId = () => crypto.randomUUID();

// --- MAPPERS ---

const mapNoteFromDB = (dbNote: any): Note => ({
  id: dbNote.id,
  title: dbNote.title || '',
  content: dbNote.content || '',
  excerpt: dbNote.excerpt || '',
  tags: dbNote.tags || [],
  notebookId: dbNote.notebook_id,
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
    console.error('Error fetching notes:', error);
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
    
  if (error) console.error('Error saving note to Supabase:', error);
};

export const deleteNote = async (id: string): Promise<void> => {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) console.error('Error deleting note from Supabase:', error);
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
    console.error('Error fetching notebooks:', error);
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
    console.error('Error creating notebook in Supabase:', error);
    throw error;
  }

  return newNotebook;
};

export const deleteNotebook = async (id: string): Promise<void> => {
  // Logic: Move notes to another notebook or delete them? 
  // For simplicity: Notes in deleted notebook become "Orphaned" (null notebook_id) or deleted.
  // We'll set notebook_id to null for safety in this implementation if we can, or just let DB handle cascade.
  // Based on SQL 'on delete set null', we just delete the notebook.
  
  const { error } = await supabase
      .from('notebooks')
      .delete()
      .eq('id', id);
        
  if (error) console.error('Error deleting notebook in Supabase:', error);
};

export const createNote = async (notebookId: string): Promise<Note> => {
  const newNote: Note = {
    id: generateId(),
    title: '',
    content: '',
    excerpt: '',
    tags: [],
    notebookId,
    updatedAt: Date.now(),
    createdAt: Date.now(),
  };
  
  await saveNote(newNote);
  return newNote;
};
