
export interface Note {
  id: string;
  title: string;
  content: string; // Storing markdown or plain text
  excerpt: string;
  tags: string[];
  notebookId: string;
  updatedAt: number; // Timestamp
  createdAt: number; // Timestamp
}

export interface Notebook {
  id: string;
  name: string;
  emoji?: string;
  parentId?: string | null; // ID of the parent notebook, null if root
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
}

export interface AIResponseState {
  isLoading: boolean;
  error: string | null;
  result: string | null;
}

export enum ViewMode {
  EDITOR = 'EDITOR',
  EMPTY = 'EMPTY',
  ACCOUNT = 'ACCOUNT',
}
