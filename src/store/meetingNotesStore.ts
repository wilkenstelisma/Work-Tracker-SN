import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { MeetingNote } from '../types';

const STORAGE_KEY = 'arc-meeting-notes';

function loadNotes(): MeetingNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MeetingNote[];
  } catch {
    return [];
  }
}

function saveNotes(notes: MeetingNote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

interface MeetingNotesStore {
  notes: MeetingNote[];
  createNote: (data: { title: string; meetingDate: string; notes: string }) => string;
  updateNote: (id: string, updates: Partial<Pick<MeetingNote, 'title' | 'meetingDate' | 'notes'>>) => void;
  deleteNote: (id: string) => void;
}

export const useMeetingNotesStore = create<MeetingNotesStore>((set, get) => ({
  notes: loadNotes(),

  createNote: (data) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const note: MeetingNote = { id, ...data, createdAt: now, updatedAt: now };
    const notes = [note, ...get().notes];
    saveNotes(notes);
    set({ notes });
    return id;
  },

  updateNote: (id, updates) => {
    const notes = get().notes.map(n =>
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    );
    saveNotes(notes);
    set({ notes });
  },

  deleteNote: (id) => {
    const notes = get().notes.filter(n => n.id !== id);
    saveNotes(notes);
    set({ notes });
  },
}));
