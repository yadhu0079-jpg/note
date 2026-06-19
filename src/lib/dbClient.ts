import { Note, CreateNoteInput, UpdateNoteInput } from '../types';

// Let's create an elegant hybrid client that makes requests to the backend /api
// but automatically falls back to browser localStorage if it detects the backend is missing (e.g., Netlify static serve)
let useLocalStorageFallback = false;

// Seed notes for localStorage to match the starting SQLite experience
const LOCAL_STORAGE_SEED: Note[] = [
  {
    id: 1,
    title: 'Lightweight Design Principles 🇨🇭',
    content: 'Aim for high-contrast typography, generous negative space, and smooth micro-animations. Avoid unnecessary borders or box shadows. Focus on pure clarity and Swiss-style alignments.',
    category: 'Inspiration',
    tags: ['Design', 'Swiss', 'UI-UX'],
    color: 'stone',
    isPinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Weekly Grocery List',
    content: '- Fresh greens (kale, baby spinach)\n- Oatmeal and honey\n- Cold brew coffee\n- Dark chocolate (72% cacao)\n- Sourdough loaf',
    category: 'Personal',
    tags: ['Shopping', 'Routine'],
    color: 'cream',
    isPinned: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 3,
    title: 'Applet Feature Ideas',
    content: '1. Fast search indexing with sqlite full-text search capability.\n2. Category custom colors / accent badges.\n3. Floating toolbar for editor styles.\n4. Keyboard shortcuts (Ctrl+D for delete, Ctrl+S for save, Esc to go back).',
    category: 'Work',
    tags: ['Applet', 'Ideas', 'Features'],
    color: 'slate',
    isPinned: false,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  }
];

function getLocalStorageNotes(): Note[] {
  const data = localStorage.getItem('note_keeper_notes');
  if (!data) {
    localStorage.setItem('note_keeper_notes', JSON.stringify(LOCAL_STORAGE_SEED));
    return LOCAL_STORAGE_SEED;
  }
  try {
    return JSON.parse(data);
  } catch {
    return LOCAL_STORAGE_SEED;
  }
}

function saveLocalStorageNotes(notes: Note[]) {
  localStorage.setItem('note_keeper_notes', JSON.stringify(notes));
}

// Check with a fast HEAD/GET request on startup if backend /api is operational
export async function detectBackendService(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/categories', { method: 'GET', signal: AbortSignal.timeout(3000) });
    // If we're on Netlify, /api/categories might return 404, or return index.html (with HTML type)
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      useLocalStorageFallback = false;
      return true;
    }
  } catch (e) {
    console.warn('Backend server not detected, falling back to LocalStorage mode:', e);
  }
  useLocalStorageFallback = true;
  return false;
}

export function isUsingLocalFallback(): boolean {
  return useLocalStorageFallback;
}

export async function fetchAllNotes(filters?: { query?: string; category?: string; tag?: string }): Promise<Note[]> {
  if (useLocalStorageFallback) {
    let notes = getLocalStorageNotes();

    if (filters?.category && filters.category !== 'all') {
      notes = notes.filter(n => n.category.toLowerCase() === filters.category!.toLowerCase());
    }

    if (filters?.query) {
      const q = filters.query.toLowerCase();
      notes = notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }

    if (filters?.tag && filters.tag !== 'all') {
      notes = notes.filter(n => n.tags.includes(filters.tag!));
    }

    // Sort: Pinned first, then newest edited first
    return notes.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });
  }

  // Real backend call
  const queryParams = new URLSearchParams();
  if (filters?.query) queryParams.append('q', filters.query);
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.tag) queryParams.append('tag', filters.tag);

  const res = await fetch(`/api/notes?${queryParams.toString()}`);
  if (!res.ok) throw new Error('API server notes fetch failed');
  return res.json();
}

export async function fetchCategories(): Promise<string[]> {
  if (useLocalStorageFallback) {
    const notes = getLocalStorageNotes();
    const categoriesSet = new Set<string>();
    notes.forEach(n => {
      if (n.category) categoriesSet.add(n.category);
    });
    return Array.from(categoriesSet).sort();
  }

  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error('API server categories fetch failed');
  return res.json();
}

export async function fetchTags(): Promise<string[]> {
  if (useLocalStorageFallback) {
    const notes = getLocalStorageNotes();
    const tagsSet = new Set<string>();
    notes.forEach(n => {
      n.tags.forEach(t => {
        if (t) tagsSet.add(t);
      });
    });
    return Array.from(tagsSet).sort();
  }

  const res = await fetch('/api/tags');
  if (!res.ok) throw new Error('API server tags fetch failed');
  return res.json();
}

export async function saveNote(input: CreateNoteInput, idToEdit?: number | null): Promise<Note> {
  if (useLocalStorageFallback) {
    const notes = getLocalStorageNotes();
    const now = new Date().toISOString();

    if (idToEdit) {
      // Edit record
      const index = notes.findIndex(n => n.id === idToEdit);
      if (index === -1) throw new Error('Note not found inside LocalStorage database');
      
      const updatedNote: Note = {
        ...notes[index],
        title: input.title,
        content: input.content,
        category: input.category,
        tags: input.tags,
        color: input.color,
        isPinned: input.isPinned,
        updatedAt: now,
      };

      notes[index] = updatedNote;
      saveLocalStorageNotes(notes);
      return updatedNote;
    } else {
      // Create record
      const maxId = notes.reduce((max, n) => n.id > max ? n.id : max, 0);
      const newNote: Note = {
        id: maxId + 1,
        title: input.title,
        content: input.content,
        category: input.category,
        tags: input.tags,
        color: input.color,
        isPinned: input.isPinned,
        createdAt: now,
        updatedAt: now,
      };

      notes.push(newNote);
      saveLocalStorageNotes(notes);
      return newNote;
    }
  }

  // Real backend call
  const url = idToEdit ? `/api/notes/${idToEdit}` : '/api/notes';
  const method = idToEdit ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) throw new Error('Note save endpoint failed');
  return res.json();
}

export async function deleteNote(id: number): Promise<boolean> {
  if (useLocalStorageFallback) {
    const notes = getLocalStorageNotes();
    const filteredNotes = notes.filter(n => n.id !== id);
    saveLocalStorageNotes(filteredNotes);
    return true;
  }

  const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Note delete endpoint failed');
  return true;
}

export async function togglePinStatus(id: number, currentPinned: boolean): Promise<boolean> {
  if (useLocalStorageFallback) {
    const notes = getLocalStorageNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      notes[index].isPinned = !currentPinned;
      notes[index].updatedAt = new Date().toISOString();
      saveLocalStorageNotes(notes);
      return true;
    }
    return false;
  }

  const res = await fetch(`/api/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isPinned: !currentPinned }),
  });
  if (!res.ok) throw new Error('Pin action endpoint failed');
  return true;
}
