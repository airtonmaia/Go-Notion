
import { supabase } from './supabase';
import { Note, Notebook, NoteRevision, Share } from '../types';

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
  parentId: dbNotebook.parent_id,
});

const mapNotebookToDB = (notebook: Notebook, userId: string) => ({
  id: notebook.id,
  user_id: userId,
  name: notebook.name,
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
    const defaultNb: Notebook = { id: generateId(), name: 'Primeiro Caderno', parentId: null };
    await createNotebook(defaultNb.name, null);
    return [defaultNb];
  }
  
  return data.map(mapNotebookFromDB);
};

export const createNotebook = async (name: string, parentId: string | null = null): Promise<Notebook> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const newNotebook: Notebook = {
    id: generateId(),
    name: name.trim() || 'Novo Caderno',
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

// --- SHARES / SHARED NOTES ---
const mapShareFromDB = (row: any): Share => ({
  id: row.id,
  resourceType: row.resource_type,
  resourceId: row.resource_id,
  granteeEmail: row.grantee_email,
  granteeUserId: row.grantee_user_id,
  role: row.role,
  publicRole: row.public_role,
  publicToken: row.public_token,
  invitedBy: row.invited_by,
  createdAt: row.created_at,
});

export const getSharedNotes = async (): Promise<Note[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return [];

  // Fetch shares where the current user/email is grantee or the resource is public_view
  const { data: shareRows, error: shareError } = await supabase
    .from('shares')
    .select('*')
    .or(`grantee_user_id.eq.${user.id},grantee_email.eq.${user.email},public_role.eq.viewer`);

  if (shareError || !shareRows) {
    console.error('Error fetching shares:', shareError?.message);
    return [];
  }

  const noteShareIds = shareRows
    .filter((s: any) => s.resource_type === 'note')
    .map((s: any) => s.resource_id);

  const notebookShareIds = shareRows
    .filter((s: any) => s.resource_type === 'notebook')
    .map((s: any) => s.resource_id);

  const noteIdsSet = new Set<string>(noteShareIds);

  // Notes directly shared
  let directNotes: Note[] = [];
  if (noteIdsSet.size > 0) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .in('id', Array.from(noteIdsSet));
    if (error) {
      console.error('Error fetching shared notes:', error.message);
    } else {
      directNotes = (data || []).map(mapNoteFromDB);
    }
  }

  // Notes from shared notebooks
  let notebookNotes: Note[] = [];
  if (notebookShareIds.length > 0) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .in('notebook_id', notebookShareIds);
    if (error) {
      console.error('Error fetching notes from shared notebooks:', error.message);
    } else {
      notebookNotes = (data || []).map(mapNoteFromDB);
    }
  }

  // Merge uniques
  const merged = [...directNotes, ...notebookNotes];
  const byId: Record<string, Note> = {};
  merged.forEach(n => { byId[n.id] = n; });
  return Object.values(byId);
};

export const getSharedByToken = async (token: string): Promise<{ notes: Note[], notebookId?: string }> => {
  const { data: shareRow, error } = await supabase
    .from('shares')
    .select('*')
    .eq('public_token', token)
    .maybeSingle();

  if (error || !shareRow) {
    console.error('Error fetching share by token:', error?.message);
    return { notes: [] };
  }

  const share = mapShareFromDB(shareRow);

  if (share.resourceType === 'note') {
    const { data, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', share.resourceId)
      .maybeSingle();
    if (noteError || !data) {
      console.error('Error fetching shared note by token:', noteError?.message);
      return { notes: [] };
    }
    return { notes: [mapNoteFromDB(data)] };
  }

  if (share.resourceType === 'notebook') {
    const { data, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('notebook_id', share.resourceId);
    if (notesError || !data) {
      console.error('Error fetching shared notebook notes by token:', notesError?.message);
      return { notes: [] };
    }
    return { notes: data.map(mapNoteFromDB), notebookId: share.resourceId };
  }

  return { notes: [] };
};

export const getSharesForResource = async (resourceType: 'note' | 'notebook', resourceId: string): Promise<Share[]> => {
  const { data, error } = await supabase
    .from('shares')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId);

  if (error) {
    console.error('Error fetching shares:', error.message);
    return [];
  }
  return (data || []).map(mapShareFromDB);
};

export const inviteShare = async (resourceType: 'note' | 'notebook', resourceId: string, email: string, role: 'viewer' | 'editor'): Promise<Share | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('shares')
    .upsert({
      resource_type: resourceType,
      resource_id: resourceId,
      grantee_email: email.trim(),
      role,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error inviting share:', error.message);
    return null;
  }
  return mapShareFromDB(data);
};

export const updateShareRole = async (shareId: string, role: 'viewer' | 'editor'): Promise<boolean> => {
  const { error } = await supabase
    .from('shares')
    .update({ role })
    .eq('id', shareId);
  if (error) {
    console.error('Error updating share role:', error.message);
    return false;
  }
  return true;
};

export const removeShare = async (shareId: string): Promise<boolean> => {
  const { error } = await supabase.from('shares').delete().eq('id', shareId);
  if (error) {
    console.error('Error removing share:', error.message);
    return false;
  }
  return true;
};

export const setPublicShare = async (resourceType: 'note' | 'notebook', resourceId: string, enabled: boolean): Promise<Share | null> => {
  if (enabled) {
    // Check if already exists
    const { data: existing, error: existingError } = await supabase
      .from('shares')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .not('public_role', 'is', null)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking public share:', existingError.message);
    }
    if (existing) return mapShareFromDB(existing);

    const token = crypto.randomUUID();
    const { data, error } = await supabase
      .from('shares')
      .insert({
        resource_type: resourceType,
        resource_id: resourceId,
        public_role: 'viewer',
        public_token: token,
      })
      .select()
      .single();
    if (error) {
      console.error('Error enabling public share:', error.message);
      return null;
    }
    return mapShareFromDB(data);
  } else {
    const { error } = await supabase
      .from('shares')
      .delete()
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .not('public_role', 'is', null);
    if (error) {
      console.error('Error disabling public share:', error.message);
      return null;
    }
    return null;
  }
};
