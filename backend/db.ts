import Database from 'better-sqlite3';
import path from 'path';
import { Note, CreateNoteInput, UpdateNoteInput } from '../src/types';

const dbPath = path.resolve(process.cwd(), 'notes.db');
const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      tags TEXT NOT NULL DEFAULT '[]',
      color TEXT NOT NULL DEFAULT 'default',
      isPinned INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  // Insert some seed data if the database is completely empty so that the user is not greeted by a blank page
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM notes');
  const result = countStmt.get() as { count: number };
  if (result.count === 0) {
    const seedNotes = [
      {
        title: 'Lightweight Design Principles 🇨🇭',
        content: 'Aim for high-contrast typography, generous negative space, and smooth micro-animations. Avoid unnecessary borders or box shadows. Focus on pure clarity and Swiss-style alignments.',
        category: 'Inspiration',
        tags: JSON.stringify(['Design', 'Swiss', 'UI-UX']),
        color: 'stone',
        isPinned: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        title: 'Weekly Grocery List',
        content: '- Fresh greens (kale, baby spinach)\n- Oatmeal and honey\n- Cold brew coffee\n- Dark chocolate (72% cacao)\n- Sourdough loaf',
        category: 'Personal',
        tags: JSON.stringify(['Shopping', 'Routine']),
        color: 'cream',
        isPinned: 0,
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        title: 'Applet Feature Ideas',
        content: '1. Fast search indexing with sqlite full-text search capability.\n2. Category custom colors / accent badges.\n3. Floating toolbar for editor styles.\n4. Keyboard shortcuts (Ctrl+D for delete, Ctrl+S for save, Esc to go back).',
        category: 'Work',
        tags: JSON.stringify(['Applet', 'Ideas', 'Features']),
        color: 'slate',
        isPinned: 0,
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      }
    ];

    const insertStmt = db.prepare(`
      INSERT INTO notes (title, content, category, tags, color, isPinned, createdAt, updatedAt)
      VALUES (@title, @content, @category, @tags, @color, @isPinned, @createdAt, @updatedAt)
    `);

    const transaction = db.transaction((notes) => {
      for (const note of notes) {
        insertStmt.run(note);
      }
    });

    transaction(seedNotes);
  }
}

// Map database row to our typed Note interface
function mapRowToNote(row: any): Note {
  return {
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    isPinned: Boolean(row.isPinned),
  };
}

export function getAllNotes(f?: { query?: string; category?: string; tag?: string }): Note[] {
  let queryStr = 'SELECT * FROM notes';
  const valParams: any[] = [];
  const filters: string[] = [];

  if (f?.category && f.category !== 'all') {
    filters.push('category = ?');
    valParams.push(f.category);
  }

  if (f?.query) {
    filters.push('(title LIKE ? OR content LIKE ?)');
    valParams.push(`%${f.query}%`, `%${f.query}%`);
  }

  if (filters.length > 0) {
    queryStr += ' WHERE ' + filters.join(' AND ');
  }

  // Sort: pinned first, then newest updated first
  queryStr += ' ORDER BY isPinned DESC, updatedAt DESC';

  const rows = db.prepare(queryStr).all(...valParams);
  
  let notes = rows.map(mapRowToNote);

  // Client-side filtering for tag as it's JSON stored
  if (f?.tag && f.tag !== 'all') {
    notes = notes.filter((note) => note.tags.includes(f.tag!));
  }

  return notes;
}

export function getNoteById(id: number): Note | undefined {
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  return row ? mapRowToNote(row) : undefined;
}

export function createNote(input: CreateNoteInput): Note {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO notes (title, content, category, tags, color, isPinned, createdAt, updatedAt)
    VALUES (@title, @content, @category, @tags, @color, @isPinned, @createdAt, @updatedAt)
  `);

  const info = stmt.run({
    title: input.title,
    content: input.content,
    category: input.category || 'General',
    tags: JSON.stringify(input.tags || []),
    color: input.color || 'default',
    isPinned: input.isPinned ? 1 : 0,
    createdAt: now,
    updatedAt: now,
  });

  const newId = info.lastInsertRowid as number;
  return getNoteById(newId)!;
}

export function updateNote(id: number, input: UpdateNoteInput): Note | undefined {
  const existingNote = getNoteById(id);
  if (!existingNote) return undefined;

  const now = new Date().toISOString();
  
  const updatedData = {
    title: input.title !== undefined ? input.title : existingNote.title,
    content: input.content !== undefined ? input.content : existingNote.content,
    category: input.category !== undefined ? input.category : existingNote.category,
    tags: input.tags !== undefined ? JSON.stringify(input.tags) : JSON.stringify(existingNote.tags),
    color: input.color !== undefined ? input.color : existingNote.color,
    isPinned: input.isPinned !== undefined ? (input.isPinned ? 1 : 0) : (existingNote.isPinned ? 1 : 0),
    updatedAt: now,
    id,
  };

  const stmt = db.prepare(`
    UPDATE notes
    SET title = @title,
        content = @content,
        category = @category,
        tags = @tags,
        color = @color,
        isPinned = @isPinned,
        updatedAt = @updatedAt
    WHERE id = @id
  `);

  stmt.run(updatedData);
  return getNoteById(id);
}

export function deleteNote(id: number): boolean {
  const stmt = db.prepare('DELETE FROM notes WHERE id = ?');
  const info = stmt.run(id);
  return info.changes > 0;
}

export function getAllCategories(): string[] {
  const rows = db.prepare('SELECT DISTINCT category FROM notes ORDER BY category ASC').all();
  return rows.map((row: any) => row.category);
}

export function getAllTags(): string[] {
  const rows = db.prepare('SELECT tags FROM notes').all();
  const tagsSet = new Set<string>();
  for (const row of rows) {
    try {
      const tags = JSON.parse((row as any).tags || '[]');
      for (const tag of tags) {
        if (tag) tagsSet.add(tag);
      }
    } catch {
      // Ignored
    }
  }
  return Array.from(tagsSet).sort();
}
