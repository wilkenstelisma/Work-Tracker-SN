import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { useMeetingNotesStore } from '../store/meetingNotesStore';
import { MeetingNote } from '../types';

const SETTINGS_KEY = 'arc-settings';

function getApiKey(): string {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return s.claudeApiKey ?? '';
  } catch {
    return '';
  }
}

async function refineNotes(notes: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No API key configured. Add your Claude API key in Settings > AI Integration.');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Please refine and restructure the following meeting notes into a clean, professional format. Use clear headings, bullet points, and organized sections. Preserve all the key information but make it well-structured and easy to read.\n\nMeeting Notes:\n${notes}`,
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } })?.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const text = data.content.find(b => b.type === 'text')?.text;
  if (!text) throw new Error('No response from Claude.');
  return text;
}

interface NoteFormState {
  title: string;
  meetingDate: string;
  notes: string;
}

const emptyForm = (): NoteFormState => ({
  title: '',
  meetingDate: new Date().toISOString().split('T')[0],
  notes: '',
});

export default function MeetingNotes() {
  const { notes, createNote, updateNote, deleteNote } = useMeetingNotesStore();
  const [selected, setSelected] = useState<MeetingNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<NoteFormState>(emptyForm());
  const [isRefining, setIsRefining] = useState(false);
  const [search, setSearch] = useState('');

  function openCreate() {
    setSelected(null);
    setIsCreating(true);
    setForm(emptyForm());
  }

  function openNote(note: MeetingNote) {
    setSelected(note);
    setIsCreating(false);
    setForm({ title: note.title, meetingDate: note.meetingDate, notes: note.notes });
  }

  function closePanel() {
    setSelected(null);
    setIsCreating(false);
    setForm(emptyForm());
  }

  function handleSave() {
    if (!form.title.trim() || !form.meetingDate || !form.notes.trim()) {
      toast.error('Title, date, and notes are required.');
      return;
    }
    if (isCreating) {
      createNote({ title: form.title.trim(), meetingDate: form.meetingDate, notes: form.notes });
      toast.success('Meeting note created!');
    } else if (selected) {
      updateNote(selected.id, { title: form.title.trim(), meetingDate: form.meetingDate, notes: form.notes });
      toast.success('Meeting note updated!');
    }
    closePanel();
  }

  async function handleRefine() {
    if (!form.notes.trim()) {
      toast.error('Enter some notes first.');
      return;
    }
    setIsRefining(true);
    try {
      const refined = await refineNotes(form.notes);
      setForm(f => ({ ...f, notes: refined }));
      toast.success('Notes refined!');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsRefining(false);
    }
  }

  function handleDelete(note: MeetingNote) {
    if (!window.confirm(`Delete "${note.title}"?`)) return;
    deleteNote(note.id);
    if (selected?.id === note.id) closePanel();
    toast.success('Note deleted.');
  }

  const sorted = [...notes]
    .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime())
    .filter(n => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.notes.toLowerCase().includes(q);
    });

  const showPanel = isCreating || selected !== null;

  return (
    <div className="flex h-full overflow-hidden">
      {/* List */}
      <div className={`flex flex-col ${showPanel ? 'w-80 flex-shrink-0' : 'flex-1'} border-r border-gray-200 bg-white overflow-hidden`}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-base">Meeting Notes</h2>
          <button
            onClick={openCreate}
            className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            + New Note
          </button>
        </div>

        <div className="px-4 py-2 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search notes..."
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">📝</p>
              {search.trim() ? (
                <p className="text-sm">No notes match "{search}".</p>
              ) : (
                <>
                  <p className="text-sm">No meeting notes yet.</p>
                  <p className="text-xs mt-1">Click "New Note" to get started.</p>
                </>
              )}
            </div>
          ) : (
            sorted.map(note => (
              <button
                key={note.id}
                onClick={() => openNote(note)}
                className={`w-full text-left px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selected?.id === note.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                }`}
              >
                <p className="text-sm font-medium text-slate-800 truncate">{note.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {format(parseISO(note.meetingDate), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{note.notes}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail / Form Panel */}
      {showPanel && (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">
              {isCreating ? 'New Meeting Note' : 'Edit Meeting Note'}
            </h3>
            <div className="flex items-center gap-2">
              {selected && (
                <button
                  onClick={() => handleDelete(selected)}
                  className="text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              )}
              <button onClick={closePanel} className="text-gray-400 hover:text-gray-600 text-lg px-2">✕</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Weekly Standup, Project Kickoff..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                maxLength={150}
              />
            </div>

            {/* Meeting Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.meetingDate}
                onChange={e => setForm(f => ({ ...f, meetingDate: e.target.value }))}
              />
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">Notes <span className="text-red-500">*</span></label>
                <button
                  onClick={handleRefine}
                  disabled={isRefining || !form.notes.trim()}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    isRefining
                      ? 'border-purple-200 text-purple-400 cursor-not-allowed bg-purple-50'
                      : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title="Use Claude AI to refine and restructure your notes"
                >
                  {isRefining ? (
                    <>
                      <span className="inline-block w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>✨ Refine with AI</>
                  )}
                </button>
              </div>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                placeholder="Jot down your meeting notes here..."
                rows={16}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">
                Click "Refine with AI" to have Claude restructure your notes into a clean, professional format.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={closePanel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.title.trim() || !form.meetingDate || !form.notes.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isCreating ? 'Create Note' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
