import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Notebook, AlertCircle, RefreshCw, Layers, Pin, BookOpen, X, Info } from 'lucide-react';
import Sidebar from './components/Sidebar';
import NoteCard from './components/NoteCard';
import NoteForm from './components/NoteForm';
import NoteDetailView from './components/NoteDetailView';
import { Note, SearchFilters, CreateNoteInput } from './types';
import * as dbClient from './lib/dbClient';

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initFinished, setInitFinished] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

  // Focus and layout modals states
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const [noteIdToDelete, setNoteIdToDelete] = useState<number | null>(null);

  // Reactive filters state
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    tag: 'all',
  });

  // Current system time for header personalization
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Clock updates
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync mode first
  useEffect(() => {
    const initializeDb = async () => {
      try {
        await dbClient.detectBackendService();
        setIsLocalMode(dbClient.isUsingLocalFallback());
      } catch (err) {
        console.error('Error during fallback check:', err);
      } finally {
        setInitFinished(true);
      }
    };
    initializeDb();
  }, []);

  // Fetch lists and collections from SQLite backend or local Fallback
  const loadData = async (activeFilters = filters) => {
    setLoading(true);
    try {
      const [notesData, categoriesData, tagsData] = await Promise.all([
        dbClient.fetchAllNotes({
          query: activeFilters.query,
          category: activeFilters.category,
          tag: activeFilters.tag,
        }),
        dbClient.fetchCategories(),
        dbClient.fetchTags(),
      ]);

      setNotes(notesData);
      setCategories(categoriesData);
      setTags(tagsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data from API/client:', err);
      setError('Could not connect to database storage server. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  // Re-run search/filter requests reactively as filters change
  useEffect(() => {
    if (initFinished) {
      loadData();
    }
  }, [filters, initFinished]);

  // Handle Note Save (Create or Update)
  const handleSaveNote = async (inputData: CreateNoteInput) => {
    try {
      const saved = await dbClient.saveNote(inputData, noteToEdit?.id);

      await loadData();
      
      // Close forms/modals
      setFormOpen(false);
      setNoteToEdit(null);
      if (selectedNote && noteToEdit && selectedNote.id === noteToEdit.id) {
        setSelectedNote(saved);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save the note. Please try again.');
    }
  };

  // Handle Delete note
  const promptDeleteNote = (id: number) => {
    setNoteIdToDelete(id);
  };

  const handleDeleteNote = async () => {
    if (noteIdToDelete === null) return;
    const id = noteIdToDelete;

    try {
      await dbClient.deleteNote(id);

      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
      if (noteToEdit?.id === id) {
        setNoteToEdit(null);
        setFormOpen(false);
      }

      setNoteIdToDelete(null);
      await loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete the note.');
    }
  };

  // Toggle Pinned preference
  const handleTogglePin = async (note: Note) => {
    try {
      await dbClient.togglePinStatus(note.id, note.isPinned);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper mappings
  const mapObjectToNote = (obj: any): Note => ({
    ...obj,
    tags: Array.isArray(obj.tags) ? obj.tags : JSON.parse(obj.tags || '[]'),
    isPinned: Boolean(obj.isPinned),
  });

  const openCreateForm = () => {
    setNoteToEdit(null);
    setFormOpen(true);
  };

  const openEditForm = (note: Note) => {
    setNoteToEdit(note);
    setFormOpen(true);
  };

  const selectNoteForReading = (note: Note) => {
    setSelectedNote(note);
  };

  // Divide notes into Pinned and Unpinned for clear visual structural boundaries
  const pinnedList = notes.filter((n) => n.isPinned);
  const standardList = notes.filter((n) => !n.isPinned);

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans select-none antialiased">
      {/* Dynamic Header */}
      <header className="border-b border-stone-200/60 bg-white/85 backdrop-blur-md sticky top-0 z-40 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-sm">
              <Notebook className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-medium text-lg text-stone-900 leading-tight">Note Keeper</h1>
                {isLocalMode && (
                  <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md font-semibold tracking-wider uppercase bg-stone-100 text-stone-700 border border-stone-250">
                    Local Fallback
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase">Personal Database Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-mono font-medium text-stone-500">Local Time</span>
              <span className="block text-sm font-display font-semibold text-stone-900">{currentTime || '12:00 PM'}</span>
            </div>
            <button
              id="header-create-note-btn"
              onClick={openCreateForm}
              className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs md:text-sm font-semibold shadow-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Note</span>
            </button>
          </div>
        </div>
      </header>

      {/* Primary Dashboard Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar columns filters */}
        <Sidebar
          filters={filters}
          onChangeFilters={setFilters}
          categories={categories}
          tags={tags}
          notes={notes}
        />

        {/* Notes listing panel */}
        <div className="flex-grow flex flex-col gap-6">
          {error && (
            <div id="api-error-banner" className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-grow">
                <p className="text-sm font-semibold text-rose-900">Database Connection Issue</p>
                <p className="text-xs text-rose-600/80 mt-0.5">{error}</p>
              </div>
              <button
                onClick={() => loadData()}
                className="p-1 rounded-md text-rose-400 hover:text-rose-600 hover:bg-rose-100/50 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex-grow flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="w-7 h-7 text-stone-400 animate-spin" />
              <p className="text-xs text-stone-400 font-mono tracking-wider">Syncing database records...</p>
            </div>
          ) : (
            <div className="space-y-8 flex-grow">
              {/* If empty lists initially */}
              {notes.length === 0 ? (
                <div id="empty-state-card" className="flex-grow flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-stone-200/80 rounded-2xl bg-white/40">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4 shadow-sm border border-stone-200/25">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-stone-800 tracking-tight">No notes match criteria</h3>
                  <p className="text-sm text-stone-500 max-w-sm mt-1.5 leading-relaxed font-sans">
                    Try wiping search queries, select all categories in Sidebar, or click Create Note to write a fresh record.
                  </p>
                  {(filters.query || filters.category !== 'all' || filters.tag !== 'all') && (
                    <button
                      id="reset-filters-empty-btn"
                      onClick={() => setFilters({ query: '', category: 'all', tag: 'all' })}
                      className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold border border-stone-200 transition-colors cursor-pointer"
                    >
                      Clear Search Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Pinned notes division */}
                  {pinnedList.length > 0 && (
                    <div id="pinned-section" className="space-y-3.5">
                      <div className="flex items-center gap-1.5">
                        <Pin className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                        <h2 className="text-xs font-display font-bold tracking-widest text-[#a87a20] uppercase">Pinned Notes</h2>
                        <span className="text-[10px] bg-amber-100 text-[#a87a20] font-mono px-2 py-0.5 rounded-full font-bold ml-1.5">
                          {pinnedList.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                        <AnimatePresence mode="popLayout">
                          {pinnedList.map((note) => (
                            <NoteCard
                              key={note.id}
                              note={note}
                              onEdit={openEditForm}
                              onDelete={promptDeleteNote}
                              onTogglePin={handleTogglePin}
                              onSelect={selectNoteForReading}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* Standard Notes division */}
                  {standardList.length > 0 && (
                    <div id="all-notes-section" className="space-y-3.5">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-stone-500" />
                        <h2 className="text-xs font-display font-bold tracking-widest text-stone-500 uppercase">Documents</h2>
                        <span className="text-[10px] bg-stone-200 text-stone-600 font-mono px-2 py-0.5 rounded-full font-bold ml-1.5">
                          {standardList.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                        <AnimatePresence mode="popLayout">
                          {standardList.map((note) => (
                            <NoteCard
                              key={note.id}
                              note={note}
                              onEdit={openEditForm}
                              onDelete={promptDeleteNote}
                              onTogglePin={handleTogglePin}
                              onSelect={selectNoteForReading}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Editor Modal Popup Container (Form) */}
      <AnimatePresence>
        {formOpen && (
          <div id="editor-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
            <motion.div
              layoutId="editor-box"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg rounded-2xl border border-stone-205 bg-[#fafcfb] shadow-xl p-6 md:p-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                  <h2 className="font-display font-medium text-lg text-stone-900">
                    {noteToEdit ? 'Edit Notes Record' : 'Create New Note'}
                  </h2>
                  <p className="text-[10px] text-stone-400 font-mono uppercase mt-0.5">Note Management Card</p>
                </div>
                <button
                  id="form-btn-close-header"
                  onClick={() => {
                    setFormOpen(false);
                    setNoteToEdit(null);
                  }}
                  className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-50 shadow-sm transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <NoteForm
                noteToEdit={noteToEdit}
                onSave={handleSaveNote}
                onCancel={() => {
                  setFormOpen(false);
                  setNoteToEdit(null);
                }}
                existingCategories={categories}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Note Detail Reader Overlay */}
      <AnimatePresence>
        {selectedNote && (
          <NoteDetailView
            note={selectedNote}
            onClose={() => setSelectedNote(null)}
            onEdit={(note) => {
              setSelectedNote(null);
              openEditForm(note);
            }}
            onDelete={(id) => promptDeleteNote(id)}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {noteIdToDelete !== null && (
          <div id="delete-confirmation-overlay" className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white shadow-xl p-6"
            >
              <h3 className="font-display font-semibold text-lg text-stone-900 tracking-tight mb-2">Delete Note</h3>
              <p className="text-sm text-stone-500 leading-relaxed font-sans mb-6">
                Are you sure you want to permanently delete this note? This action is immediate and cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  id="btn-delete-cancel"
                  onClick={() => setNoteIdToDelete(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-delete-confirm"
                  onClick={handleDeleteNote}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer bar */}
      <footer className="border-t border-stone-200/50 bg-white/50 py-4 px-4 text-center text-[10px] font-mono text-stone-400 tracking-wider">
        NOTE KEEPER • SWISS MINIMAL DESIGN • LOCAL SQLITE PERSISTENCE
      </footer>
    </div>
  );
}
