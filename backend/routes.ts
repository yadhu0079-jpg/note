import { Router, Request, Response } from 'express';
import * as db from './db';
import { CreateNoteInput, UpdateNoteInput } from '../src/types';

const router = Router();

// GET all notes (supports optional filters)
router.get('/notes', (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const category = (req.query.category as string) || '';
    const tag = (req.query.tag as string) || '';

    const notes = db.getAllNotes({ query, category, tag });
    res.json(notes);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Failed to retrieve notes' });
  }
});

// GET dynamic categories list
router.get('/categories', (req: Request, res: Response) => {
  try {
    const categories = db.getAllCategories();
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

// GET dynamic tags list
router.get('/tags', (req: Request, res: Response) => {
  try {
    const tags = db.getAllTags();
    res.json(tags);
  } catch (err) {
    console.error('Error fetching tags:', err);
    res.status(500).json({ error: 'Failed to retrieve tags' });
  }
});

// GET individual note by ID
router.get('/notes/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const note = db.getNoteById(id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (err) {
    console.error('Error fetching note:', err);
    res.status(500).json({ error: 'Failed to retrieve note' });
  }
});

// POST create note
router.post('/notes', (req: Request, res: Response) => {
  try {
    const { title, content, category, tags, color, isPinned } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (content === undefined || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required (as a string)' });
    }

    const input: CreateNoteInput = {
      title: title.trim(),
      content: content,
      category: (category && typeof category === 'string') ? category.trim() : 'General',
      tags: Array.isArray(tags) ? tags : [],
      color: (color && typeof color === 'string') ? color : 'default',
      isPinned: Boolean(isPinned),
    };

    const newNote = db.createNote(input);
    res.status(201).json(newNote);
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PUT update note
router.put('/notes/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const { title, content, category, tags, color, isPinned } = req.body;

    const input: UpdateNoteInput = {};
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Title must be a non-empty string' });
      }
      input.title = title.trim();
    }
    if (content !== undefined) {
      if (typeof content !== 'string') {
        return res.status(400).json({ error: 'Content must be a string' });
      }
      input.content = content;
    }
    if (category !== undefined) {
      input.category = typeof category === 'string' ? category.trim() : 'General';
    }
    if (tags !== undefined) {
      input.tags = Array.isArray(tags) ? tags : [];
    }
    if (color !== undefined) {
      input.color = String(color);
    }
    if (isPinned !== undefined) {
      input.isPinned = Boolean(isPinned);
    }

    const updatedNote = db.updateNote(id, input);
    if (!updatedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(updatedNote);
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE delete note
router.delete('/notes/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const success = db.deleteNote(id);
    if (!success) {
      return res.status(404).json({ error: 'Note not found to delete' });
    }

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
