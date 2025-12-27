import { Note, Notebook, NoteRevision, Share } from '../types';

const DB_NAME = 'GoNotionDB';
const DB_VERSION = 1;

export interface CacheStats {
  notes: number;
  notebooks: number;
  revisions: number;
  lastSync: number;
}

let dbInstance: IDBDatabase | null = null;

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('notebooks')) {
        db.createObjectStore('notebooks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('revisions')) {
        db.createObjectStore('revisions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('shares')) {
        db.createObjectStore('shares', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('syncMetadata')) {
        db.createObjectStore('syncMetadata', { keyPath: 'key' });
      }
    };
  });
};

// --- NOTES CACHE ---

export const cacheNotes = async (notes: Note[]): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('notes', 'readwrite');
  const store = tx.objectStore('notes');

  notes.forEach((note) => {
    store.put(note);
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedNotes = async (): Promise<Note[]> => {
  const db = await getDB();
  const tx = db.transaction('notes', 'readonly');
  const store = tx.objectStore('notes');
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getCachedNote = async (id: string): Promise<Note | undefined> => {
  const db = await getDB();
  const tx = db.transaction('notes', 'readonly');
  const store = tx.objectStore('notes');
  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const cacheNote = async (note: Note): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('notes', 'readwrite');
  const store = tx.objectStore('notes');
  store.put(note);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const deleteCachedNote = async (id: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('notes', 'readwrite');
  const store = tx.objectStore('notes');
  store.delete(id);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// --- NOTEBOOKS CACHE ---

export const cacheNotebooks = async (notebooks: Notebook[]): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('notebooks', 'readwrite');
  const store = tx.objectStore('notebooks');

  notebooks.forEach((notebook) => {
    store.put(notebook);
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedNotebooks = async (): Promise<Notebook[]> => {
  const db = await getDB();
  const tx = db.transaction('notebooks', 'readonly');
  const store = tx.objectStore('notebooks');
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const cacheNotebook = async (notebook: Notebook): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('notebooks', 'readwrite');
  const store = tx.objectStore('notebooks');
  store.put(notebook);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const deleteCachedNotebook = async (id: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('notebooks', 'readwrite');
  const store = tx.objectStore('notebooks');
  store.delete(id);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// --- REVISIONS CACHE ---

export const cacheRevisions = async (revisions: NoteRevision[]): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('revisions', 'readwrite');
  const store = tx.objectStore('revisions');

  revisions.forEach((revision) => {
    store.put(revision);
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedRevisions = async (noteId: string): Promise<NoteRevision[]> => {
  const db = await getDB();
  const tx = db.transaction('revisions', 'readonly');
  const store = tx.objectStore('revisions');
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const allRevisions = request.result as NoteRevision[];
      const filtered = allRevisions.filter((r) => r.noteId === noteId);
      resolve(filtered);
    };
    request.onerror = () => reject(request.error);
  });
};

// --- SHARES CACHE ---

export const cacheShares = async (shares: Share[]): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('shares', 'readwrite');
  const store = tx.objectStore('shares');

  shares.forEach((share) => {
    store.put(share);
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedShares = async (): Promise<Share[]> => {
  const db = await getDB();
  const tx = db.transaction('shares', 'readonly');
  const store = tx.objectStore('shares');
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// --- SYNC METADATA ---

export const setLastSyncTime = async (timestamp: number): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('syncMetadata', 'readwrite');
  const store = tx.objectStore('syncMetadata');
  store.put({ key: 'lastSync', value: timestamp });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getLastSyncTime = async (): Promise<number> => {
  const db = await getDB();
  const tx = db.transaction('syncMetadata', 'readonly');
  const store = tx.objectStore('syncMetadata');
  const request = store.get('lastSync');

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const result = request.result as { key: string; value: number } | undefined;
      resolve(result?.value || 0);
    };
    request.onerror = () => reject(request.error);
  });
};

// --- CACHE STATS ---

export const getCacheStats = async (): Promise<CacheStats> => {
  const notes = await getCachedNotes();
  const notebooks = await getCachedNotebooks();
  const revisions = await getCachedRevisions('');
  const lastSync = await getLastSyncTime();

  return {
    notes: notes.length,
    notebooks: notebooks.length,
    revisions: revisions.length,
    lastSync,
  };
};

// --- CLEAR CACHE ---

export const clearAllCache = async (): Promise<void> => {
  const db = await getDB();
  const stores = ['notes', 'notebooks', 'revisions', 'shares', 'syncMetadata'];

  for (const storeName of stores) {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(undefined);
      tx.onerror = () => reject(tx.error);
    });
  }
};
