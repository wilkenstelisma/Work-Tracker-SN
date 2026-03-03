import { create } from 'zustand';

const STORAGE_KEY = 'arc-task-types';

const DEFAULT_TYPES = [
  'System Admin',
  'Digital Transformation',
  'Audit Support',
  'Risk Management',
  'Reporting',
  'Stakeholder Engagement',
  'Ad-hoc',
  'Custom',
];

function loadTypes(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TYPES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TYPES;
  } catch {
    return DEFAULT_TYPES;
  }
}

function saveTypes(types: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
}

interface TaskTypeStore {
  taskTypes: string[];
  addTaskType: (name: string) => void;
  removeTaskType: (name: string) => void;
}

export const useTaskTypeStore = create<TaskTypeStore>((set, get) => ({
  taskTypes: loadTypes(),

  addTaskType: (name) => {
    const trimmed = name.trim();
    if (!trimmed || get().taskTypes.includes(trimmed)) return;
    const taskTypes = [...get().taskTypes, trimmed];
    saveTypes(taskTypes);
    set({ taskTypes });
  },

  removeTaskType: (name) => {
    const taskTypes = get().taskTypes.filter(t => t !== name);
    saveTypes(taskTypes);
    set({ taskTypes });
  },
}));
