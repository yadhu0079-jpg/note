import React from 'react';
import { motion } from 'motion/react';
import { Pin, Trash2, Edit3, Calendar, Tag, Folder } from 'lucide-react';
import { Note } from '../types';

interface NoteCardProps {
  key?: number;
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  onTogglePin: (note: Note) => void;
  onSelect: (note: Note) => void;
}

// Map color variants to precise warm aesthetic Tailwind classes
export const colorClassesMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  stone: {
    bg: 'bg-stone-50/90',
    border: 'border-stone-200 hover:border-stone-400',
    text: 'text-stone-800',
    badge: 'bg-stone-200/60 text-stone-700 border-stone-300'
  },
  cream: {
    bg: 'bg-[#fbf8f3]',
    border: 'border-[#f3e9da] hover:border-amber-400/50',
    text: 'text-amber-950',
    badge: 'bg-[#f4eada] text-amber-900 border-amber-200'
  },
  slate: {
    bg: 'bg-slate-50/90',
    border: 'border-slate-200 hover:border-slate-400',
    text: 'text-slate-800',
    badge: 'bg-slate-200/60 text-slate-700 border-slate-300'
  },
  sage: {
    bg: 'bg-[#f4fbf7]',
    border: 'border-[#e2f5ec] hover:border-emerald-400/50',
    text: 'text-emerald-950',
    badge: 'bg-[#e2f5ec] text-emerald-900 border-emerald-200'
  },
  peach: {
    bg: 'bg-[#fffbf8]',
    border: 'border-[#fceddf] hover:border-orange-400/50',
    text: 'text-orange-950',
    badge: 'bg-[#fceddf] text-orange-900 border-orange-200'
  },
  lavender: {
    bg: 'bg-[#fafbff]',
    border: 'border-[#edf1fd] hover:border-indigo-400/50',
    text: 'text-indigo-950',
    badge: 'bg-[#edf1fd] text-indigo-900 border-indigo-200'
  },
  sky: {
    bg: 'bg-[#f5fbfd]',
    border: 'border-[#e0f3fa] hover:border-sky-400/50',
    text: 'text-sky-950',
    badge: 'bg-[#e0f3fa] text-sky-900 border-sky-200'
  }
};

export default function NoteCard({ note, onEdit, onDelete, onTogglePin, onSelect }: NoteCardProps) {
  const colorScheme = colorClassesMap[note.color] || colorClassesMap.stone;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent triggering select if clicking action buttons
    const target = e.target as HTMLElement;
    if (target.closest('.action-btn')) return;
    onSelect(note);
  };

  return (
    <motion.div
      id={`note-card-${note.id}`}
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      onClick={handleCardClick}
      className={`relative flex flex-col p-5 rounded-2xl border ${colorScheme.bg} ${colorScheme.border} shadow-sm group cursor-pointer transition-all duration-300 h-full overflow-hidden`}
    >
      {/* Top Header section */}
      <div className="flex md:items-start justify-between gap-3 mb-2">
        <h3 className={`font-display font-semibold text-lg leading-tight tracking-tight ${colorScheme.text} line-clamp-2`}>
          {note.title || 'Untitled'}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id={`btn-pin-${note.id}`}
            title={note.isPinned ? 'Unpin note' : 'Pin note'}
            onClick={() => onTogglePin(note)}
            className={`action-btn p-1.5 rounded-lg border transition-colors ${
              note.isPinned
                ? 'bg-amber-100 border-amber-300 text-amber-700'
                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100 border-transparent'
            }`}
          >
            <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Note Body Text */}
      <p className={`font-sans text-sm leading-relaxed mb-4 text-stone-600/90 whitespace-pre-line line-clamp-5 flex-grow`}>
        {note.content || <span className="italic text-stone-400">Empty note</span>}
      </p>

      {/* Note Metadata / Footer */}
      <div className="mt-auto pt-4 border-t border-dashed border-stone-200/80 flex flex-col gap-3">
        {/* Category & Tags Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {note.category && (
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border ${colorScheme.badge} font-medium`}>
              <Folder className="w-3 h-3" />
              {note.category}
            </span>
          )}
          {note.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={`${tag}-${idx}`}
              className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/60"
            >
              <Tag className="w-2.5 h-2.5 text-stone-400" />
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs text-stone-400 font-medium pl-0.5">
              +{note.tags.length - 3} item{note.tags.length - 3 > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Date & Hover action row */}
        <div className="flex items-center justify-between text-stone-400 text-xs mt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-stone-400/80" />
            {formatDate(note.updatedAt || note.createdAt)}
          </span>

          {/* Quick Action Buttons (visible on hover) */}
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
            <button
              id={`btn-edit-${note.id}`}
              title="Edit Note"
              onClick={() => onEdit(note)}
              className="action-btn p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-transparent hover:border-stone-200 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              id={`btn-delete-${note.id}`}
              title="Delete Note"
              onClick={() => onDelete(note.id)}
              className="action-btn p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
