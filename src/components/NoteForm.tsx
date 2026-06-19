import React, { useState, useEffect } from 'react';
import { X, Plus, Pin, Check } from 'lucide-react';
import { CreateNoteInput, Note } from '../types';
import { colorClassesMap } from './NoteCard';

interface NoteFormProps {
  noteToEdit?: Note | null;
  onSave: (note: CreateNoteInput) => void;
  onCancel: () => void;
  existingCategories: string[];
}

export default function NoteForm({ noteToEdit, onSave, onCancel, existingCategories }: NoteFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [color, setColor] = useState('stone');
  const [isPinned, setIsPinned] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or prefill form when noteToEdit changes
  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content);
      setCategory(noteToEdit.category);
      setTags(noteToEdit.tags);
      setColor(noteToEdit.color);
      setIsPinned(noteToEdit.isPinned);
      setIsNewCategory(!existingCategories.includes(noteToEdit.category));
    } else {
      setTitle('');
      setContent('');
      setCategory('General');
      setTags([]);
      setColor('stone');
      setIsPinned(false);
      setIsNewCategory(false);
    }
    setErrors({});
  }, [noteToEdit, existingCategories]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Please enter a note title';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSave({
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || 'General',
      tags,
      color,
      isPinned
    });
  };

  const handleAddTag = () => {
    const formattedTag = tagInput.trim().replace(/[^a-zA-Z0-9_\-]/g, '');
    if (formattedTag && !tags.includes(formattedTag)) {
      setTags([...tags, formattedTag]);
      setTagInput('');
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <form id="note-editor-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="form-title" className="block text-xs font-display font-semibold tracking-wider text-stone-500 uppercase mb-2">
          Title
        </label>
        <input
          id="form-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors({ ...errors, title: '' });
          }}
          placeholder="New amazing note title..."
          className={`w-full px-4 py-3 rounded-xl border font-display text-base bg-white focus:outline-none focus:ring-2 focus:ring-stone-500/10 focus:border-stone-500 transition-colors ${
            errors.title ? 'border-rose-300 bg-rose-50/20' : 'border-stone-200'
          }`}
        />
        {errors.title && (
          <p id="error-title" className="mt-1 text-xs text-rose-500">{errors.title}</p>
        )}
      </div>

      {/* Category selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="form-category-select" className="block text-xs font-display font-semibold tracking-wider text-stone-500 uppercase">
            Category
          </label>
          <button
            type="button"
            id="toggle-new-category"
            onClick={() => {
              setIsNewCategory(!isNewCategory);
              setCategory(isNewCategory ? 'General' : '');
            }}
            className="text-xs text-stone-600 hover:text-stone-900 font-medium underline"
          >
            {isNewCategory ? 'Select from existing' : 'Create new category'}
          </button>
        </div>

        {isNewCategory ? (
          <input
            id="form-category-input"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Type new category..."
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-stone-500 text-sm transition-colors"
          />
        ) : (
          <select
            id="form-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-stone-500 text-sm transition-colors"
          >
            <option value="General">General</option>
            {existingCategories
              .filter(cat => cat !== 'General' && cat)
              .map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))
            }
          </select>
        )}
      </div>

      {/* Content */}
      <div>
        <label htmlFor="form-content" className="block text-xs font-display font-semibold tracking-wider text-stone-500 uppercase mb-2">
          Content
        </label>
        <textarea
          id="form-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your details here..."
          rows={7}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 font-sans text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-500/10 focus:border-stone-500 transition-colors resize-y whitespace-pre-wrap"
        />
      </div>

      {/* Tag editor */}
      <div>
        <label htmlFor="form-tag-input" className="block text-xs font-display font-semibold tracking-wider text-stone-500 uppercase mb-2">
          Tags
        </label>
        <div className="flex gap-2 mb-3">
          <input
            id="form-tag-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Add tags (press Enter)"
            className="flex-grow px-4 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:border-stone-500 transition-colors"
          />
          <button
            type="button"
            id="btn-add-tag-form"
            onClick={handleAddTag}
            className="px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl flex items-center justify-center transition-colors focus:outline-none"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Existing note tags */}
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 rounded-xl border border-stone-100">
            {tags.map((tag) => (
              <span
                key={tag}
                id={`tag-chip-${tag}`}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-white border border-stone-200 text-stone-700 shadow-sm"
              >
                {tag}
                <button
                  type="button"
                  id={`remove-tag-chip-${tag}`}
                  onClick={() => handleRemoveTag(tag)}
                  className="text-stone-400 hover:text-rose-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic">No tags added yet</p>
        )}
      </div>

      {/* Colors & Pinned Container */}
      <div className="flex flex-wrap items-center justify-between gap-6 pt-2 border-t border-stone-100">
        <div>
          <span className="block text-xs font-display font-semibold tracking-wider text-stone-500 uppercase mb-3">
            Note Accent Color
          </span>
          <div className="flex gap-2">
            {Object.keys(colorClassesMap).map((colorKey) => {
              const active = color === colorKey;
              return (
                <button
                  key={colorKey}
                  type="button"
                  id={`color-swatch-${colorKey}`}
                  onClick={() => setColor(colorKey)}
                  title={`${colorKey.charAt(0).toUpperCase() + colorKey.slice(1)} accent`}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                    colorKey === 'stone' ? 'bg-stone-50 border-stone-200' :
                    colorKey === 'cream' ? 'bg-[#fbf8f3] border-[#f3e9da]' :
                    colorKey === 'slate' ? 'bg-slate-50 border-slate-200' :
                    colorKey === 'sage' ? 'bg-[#f4fbf7] border-[#e2f5ec]' :
                    colorKey === 'peach' ? 'bg-[#fffbf8] border-[#fceddf]' :
                    colorKey === 'lavender' ? 'bg-[#fafbff] border-[#edf1fd]' :
                    'bg-[#f5fbfd] border-[#e0f3fa]'
                  } ${
                    active ? 'ring-2 ring-stone-900 border-transparent scale-110 shadow-sm' : 'hover:scale-105'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5 text-stone-900" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="toggle-pin-form"
            onClick={() => setIsPinned(!isPinned)}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 border text-sm font-medium transition-colors ${
              isPinned
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-600'
            }`}
          >
            <Pin className={`w-4 h-4 ${isPinned ? 'fill-amber-500 text-amber-600' : ''}`} />
            {isPinned ? 'Pinned note' : 'Pin note'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-stone-100">
        <button
          type="button"
          id="btn-form-cancel"
          onClick={onCancel}
          className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200 rounded-xl text-sm font-medium transition-colors focus:outline-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          id="btn-form-save"
          className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500/20"
        >
          {noteToEdit ? 'Save Changes' : 'Create Note'}
        </button>
      </div>
    </form>
  );
}
