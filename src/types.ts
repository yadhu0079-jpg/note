export interface Note {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[]; // Handled as JSON string in DB, parsed to array on fetch
  color: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateNoteInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateNoteInput = Partial<CreateNoteInput>;

export interface SearchFilters {
  query: string;
  category: string;
  tag: string;
}
