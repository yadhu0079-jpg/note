import React from 'react';
import { X, Calendar, Folder, Tag, Pin, Edit3, Trash2 } from 'lucide-react';
import { Note } from '../types';
import { colorClassesMap } from './NoteCard';

interface NoteDetailViewProps {
  note: Note;
  onClose: () => void;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
}

export default function NoteDetailView({ note, onClose, onEdit, onDelete }: NoteDetailViewProps) {
  const colorScheme = colorClassesMap[note.color] || colorClassesMap.stone;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div id="note-detail-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
      <div
        id="note-detail-modal"
        className={`w-full max-w-2xl rounded-2xl border bg-white shadow-xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[80vh] ${colorScheme.border}`}
      >
        {/* Dynamic header band matches custom note color */}
        <div className={`h-2 ${colorScheme.bg} border-b border-stone-100 shrink-0`} />

        {/* Modal toolbar panel */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0 bg-stone-50">
          <div className="flex items-center gap-2">
            {note.isPinned && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <Pin className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                Pinned Note
              </span>
            )}
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${colorScheme.badge} font-medium`}>
              <Folder className="w-3.5 h-3.5" />
              {note.category || 'General'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 animate-fade-in">
            <button
              id="detail-btn-edit"
              onClick={() => onEdit(note)}
              title="Edit note"
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-transparent rounded-lg hover:border-stone-200 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              id="detail-btn-delete"
              onClick={() => onDelete(note.id)}
              title="Delete note"
              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent rounded-lg hover:border-rose-100 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-stone-200 my-1 mx-0.5" />
            <button
              id="detail-btn-close"
              onClick={onClose}
              title="Close modal"
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 border border-stone-200 shadow-sm rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Note Body scroll panel with clean typography */}
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-stone-900 tracking-tight leading-tight">
              {note.title || 'Untitled Note'}
            </h2>
            <div className="mt-2.5 flex items-center gap-1 text-stone-400 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Last edited {formatDate(note.updatedAt || note.createdAt)}</span>
            </div>
          </div>

          <div className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed text-stone-700/90 py-1 select-text">
            {note.content || <p className="italic text-stone-400">Empty note contents</p>}
          </div>

          {note.tags && note.tags.length > 0 && (
            <div className="pt-6 border-t border-dashed border-stone-100 flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg bg-stone-50 border border-stone-200/80 text-stone-600"
                >
                  <Tag className="w-3 h-3 text-stone-400" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
