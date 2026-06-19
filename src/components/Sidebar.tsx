import React from 'react';
import { Search, FolderOpen, Tag, Columns, Hash, AlertCircle, X, Layers } from 'lucide-react';
import { SearchFilters, Note } from '../types';

interface SidebarProps {
  filters: SearchFilters;
  onChangeFilters: (filters: SearchFilters) => void;
  categories: string[];
  tags: string[];
  notes: Note[];
}

export default function Sidebar({ filters, onChangeFilters, categories, tags, notes }: SidebarProps) {
  const currentCategory = filters.category || 'all';
  const currentTag = filters.tag || 'all';

  // Calculate quick database statistics
  const totalNotes = notes.length;
  const pinnedNotes = notes.filter(n => n.isPinned).length;

  // Count notes dynamically per category for custom badge indicators
  const getCategoryCount = (catName: string) => {
    if (catName === 'all') return notes.length;
    return notes.filter(n => n.category === catName).length;
  };

  const getTagCount = (tagName: string) => {
    if (tagName === 'all') return notes.length;
    return notes.filter(n => n.tags.includes(tagName)).length;
  };

  const updateFilterField = (key: keyof SearchFilters, val: string) => {
    onChangeFilters({
      ...filters,
      [key]: val,
    });
  };

  const handleClearFilters = () => {
    onChangeFilters({
      query: '',
      category: 'all',
      tag: 'all'
    });
  };

  const hasActiveFilters = filters.query !== '' || filters.category !== 'all' || filters.tag !== 'all';

  return (
    <aside id="dashboard-sidebar" className="flex flex-col gap-6 md:w-64 max-w-full shrink-0">
      {/* Search Input Box */}
      <div className="relative group">
        <label htmlFor="search-input" className="sr-only">Search notes</label>
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
        <input
          id="search-input"
          type="text"
          value={filters.query}
          onChange={(e) => updateFilterField('query', e.target.value)}
          placeholder="Search note body/title..."
          className="w-full pl-10 pr-9 py-3 rounded-xl border border-stone-200 bg-white shadow-sm font-sans text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500/10 focus:border-stone-500 transition-all"
        />
        {filters.query && (
          <button
            id="clear-search-btn"
            onClick={() => updateFilterField('query', '')}
            className="absolute right-3 top-3 p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-150 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Categories Panel */}
      <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-stone-100">
          <FolderOpen className="w-4 h-4 text-stone-500" />
          <h3 className="font-display font-bold text-sm tracking-tight text-stone-800">Categories</h3>
        </div>

        <nav aria-label="Categories" className="space-y-1">
          <button
            id="category-filter-all"
            onClick={() => updateFilterField('category', 'all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              currentCategory === 'all'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              All Categories
            </span>
          </button>

          {categories.map((cat) => {
            const isActive = currentCategory === cat;
            return (
              <button
                key={cat}
                id={`category-filter-${cat}`}
                onClick={() => updateFilterField('category', cat)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-white animate-fade-in'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <span className="truncate max-w-[130px]">{cat}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${isActive ? 'bg-stone-800/80 text-white' : 'bg-stone-100 text-stone-500 group-hover:bg-stone-200'}`}>
                  {getCategoryCount(cat)}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tags Cloud Panel */}
      <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-stone-100">
          <Tag className="w-4 h-4 text-stone-500" />
          <h3 className="font-display font-bold text-sm tracking-tight text-stone-800">Tags</h3>
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            <button
              id="tag-filter-all"
              onClick={() => updateFilterField('tag', 'all')}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                currentTag === 'all'
                  ? 'bg-stone-900 text-white border-transparent'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              #all
            </button>

            {tags.map((tag) => {
              const isActive = currentTag === tag;
              return (
                <button
                  key={tag}
                  id={`tag-filter-${tag}`}
                  onClick={() => updateFilterField('tag', tag)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? 'bg-stone-900 text-white border-transparent font-semibold shadow-sm'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Hash className="w-2.5 h-2.5 opacity-60" />
                  {tag}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-stone-400 italic">No tags registered</p>
          </div>
        )}
      </div>

      {/* Summary Stats Panel */}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col gap-2 shadow-inner">
        <h4 className="text-xs font-display font-bold text-stone-400 uppercase tracking-widest">Workspace Stats</h4>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="p-2.5 bg-white border border-stone-150 rounded-xl">
            <span className="block text-2b font-display font-semibold text-lg text-stone-800 leading-none">{totalNotes}</span>
            <span className="text-[10px] text-stone-400 font-sans tracking-wide">Total Notes</span>
          </div>
          <div className="p-2.5 bg-white border border-stone-150 rounded-xl">
            <span className="block text-2b font-display font-semibold text-lg text-amber-700 leading-none">{pinnedNotes}</span>
            <span className="text-[10px] text-stone-400 font-sans tracking-wide font-normal">Pinned Docs</span>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            id="clear-all-filters-btn"
            onClick={handleClearFilters}
            className="mt-2.5 w-full py-2 bg-stone-200/60 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium border border-stone-300/40 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            Clear active filters
          </button>
        )}
      </div>
    </aside>
  );
}
