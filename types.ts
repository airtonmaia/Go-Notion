
export interface Note {
  id: string;
  title: string;
  content: string; // Storing markdown or plain text
  excerpt: string;
  tags: string[];
  notebookId: string;
  isFavorite?: boolean; // New field
  updatedAt: number; // Timestamp
  createdAt: number; // Timestamp
}

export interface NoteRevision {
  id: string;
  noteId: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface Notebook {
  id: string;
  name: string;
  parentId?: string | null; // ID of the parent notebook, null if root
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  updated_at?: string;
}

export interface TaskItem {
  id: string;
  text: string;
  checked: boolean;
  noteId: string;
  noteTitle: string;
  updatedAt: number;
  assignee?: string;
}

export interface Share {
  id: string;
  resourceType: 'note' | 'notebook';
  resourceId: string;
  granteeEmail?: string | null;
  granteeUserId?: string | null;
  role?: 'viewer' | 'editor' | null;
  publicRole?: 'viewer' | null;
  publicToken?: string | null;
  invitedBy?: string | null;
  createdAt?: string;
}

export enum ViewMode {
  EDITOR = 'EDITOR',
  EMPTY = 'EMPTY',
  ACCOUNT = 'ACCOUNT',
}

export interface Comment {
  id: string;
  noteId: string;
  authorEmail: string;
  content: string;
  createdAt: string;
}
