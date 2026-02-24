import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Task, Subtask, Milestone, UpdateEntry, TaskStatus, Priority, TaskType, RecurrenceConfig,
} from '../types';

const STORAGE_KEY = 'arc-tasks';
const ARCHIVE_KEY = 'arc-tasks-archive';

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function makeChangelog(field: string, oldValue: unknown, newValue: unknown) {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    field,
    oldValue: String(oldValue ?? ''),
    newValue: String(newValue ?? ''),
  };
}

interface TaskStore {
  tasks: Task[];
  createTask: (data: {
    title: string;
    taskType: TaskType;
    status: TaskStatus;
    priority: Priority;
    dueDate: string;
    description?: string;
    startDate?: string;
    assignee?: string;
    notes?: string;
    isRecurring?: boolean;
    recurrence?: RecurrenceConfig;
    reminderDays?: number;
    subtasks?: Omit<Subtask, 'id'>[];
    milestones?: Omit<Milestone, 'id'>[];
  }) => string;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'changelog' | 'updates' | 'subtasks' | 'milestones'>>) => void;
  deleteTask: (id: string) => void;
  addSubtask: (taskId: string, subtask: Omit<Subtask, 'id'>) => void;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addMilestone: (taskId: string, milestone: Omit<Milestone, 'id'>) => void;
  updateMilestone: (taskId: string, milestoneId: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (taskId: string, milestoneId: string) => void;
  addUpdate: (taskId: string, text: string) => void;
  archiveOldCompleted: () => void;
  importTasks: (tasks: Task[]) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: loadTasks(),

  createTask: (data) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const task: Task = {
      id,
      title: data.title,
      taskType: data.taskType,
      status: data.status || 'Not Started',
      priority: data.priority,
      dueDate: data.dueDate,
      description: data.description,
      startDate: data.startDate,
      assignee: data.assignee,
      notes: data.notes,
      isRecurring: data.isRecurring || false,
      recurrence: data.recurrence,
      reminderDays: data.reminderDays ?? 2,
      updates: [],
      subtasks: (data.subtasks || []).map(s => ({ ...s, id: uuidv4() })),
      milestones: (data.milestones || []).map(m => ({ ...m, id: uuidv4() })),
      createdAt: now,
      updatedAt: now,
      changelog: [makeChangelog('created', '', data.title)],
    };
    const tasks = [...get().tasks, task];
    saveTasks(tasks);
    set({ tasks });
    return id;
  },

  updateTask: (id, updates) => {
    const tasks = get().tasks.map(task => {
      if (task.id !== id) return task;
      const now = new Date().toISOString();
      const entries = Object.entries(updates)
        .filter(([key]) => key !== 'updatedAt')
        .map(([key, val]) => makeChangelog(key, (task as unknown as Record<string, unknown>)[key], val));
      const completedAt = updates.status === 'Complete' && task.status !== 'Complete'
        ? now
        : updates.status !== 'Complete' && updates.status !== undefined
          ? undefined
          : task.completedAt;
      return {
        ...task,
        ...updates,
        completedAt,
        updatedAt: now,
        changelog: [...task.changelog, ...entries],
      };
    });
    saveTasks(tasks);
    set({ tasks });
  },

  deleteTask: (id) => {
    const tasks = get().tasks.filter(t => t.id !== id);
    saveTasks(tasks);
    set({ tasks });
  },

  addSubtask: (taskId, subtask) => {
    const tasks = get().tasks.map(task => {
      if (task.id !== taskId) return task;
      const newSubtask: Subtask = { ...subtask, id: uuidv4() };
      return { ...task, subtasks: [...task.subtasks, newSubtask], updatedAt: new Date().toISOString() };
    });
    saveTasks(tasks);
    set({ tasks });
  },

  updateSubtask: (taskId, subtaskId, updates) => {
    const tasks = get().tasks.map(task => {
      if (task.id !== taskId) return task;
      const subtasks = task.subtasks.map(s => s.id === subtaskId ? { ...s, ...updates } : s);
      return { ...task, subtasks, updatedAt: new Date().toISOString() };
    });
    saveTasks(tasks);
    set({ tasks });
  },

  deleteSubtask: (taskId, subtaskId) => {
    const tasks = get().tasks.map(task => {
      if (task.id !== taskId) return task;
      return { ...task, subtasks: task.subtasks.filter(s => s.id !== subtaskId), updatedAt: new Date().toISOString() };
    });
    saveTasks(tasks);
    set({ tasks });
  },

  toggleSubtask: (taskId, subtaskId) => {
    const tasks = get().tasks.map(task => {
      if (task.id !== taskId) return task;
      const subtasks = task.subtasks.map(s =>
        s.id === subtaskId ? { ...s, status: s.status === 'Done' ? 'Open' : 'Done' } as Subtask : s
      );
      return { ...task, subtasks, updatedAt: new Date().toISOString() };
    });
    saveTasks(tasks);
    set({ tasks });
  },

  addMilestone: (taskId, milestone) => {
    const tasks = get().tasks.map(task => {
      if (task.id !== taskId) return task;
      const newMs: Milestone = { ...milestone, id: uuidv4() };
      return { ...task, milestones: [...task.milestones, newMs], updatedAt: new Date().toISOString() };
    });
    saveTasks(tasks);
    set({ tasks });
  },

  updateMilestone: (taskId, milestoneId, updates) => {
    const tasks = get().tasks.map(task => {
      if (task.id !== taskId) return task;
      const milestones = task.milestones.map(m => m.id === milestoneId ? { ...m, ...updates } : m);
      return { ...task, milestones, updatedAt: new Date().toISOString() };
    });
    saveTasks(tasks);
    set({ tasks });
  },

  deleteMilestone: (taskId, milestoneId) => {
    const tasks = get().tasks.map(task => {
      if (task.id !== taskId) return task;
      return { ...task, milestones: task.milestones.filter(m => m.id !== milestoneId), updatedAt: new Date().toISOString() };
    });
    saveTasks(tasks);
    set({ tasks });
  },

  addUpdate: (taskId, text) => {
    const entry: UpdateEntry = { id: uuidv4(), timestamp: new Date().toISOString(), text };
    const tasks = get().tasks.map(task => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        updates: [entry, ...task.updates],
        updatedAt: new Date().toISOString(),
        changelog: [...task.changelog, makeChangelog('update', '', text)],
      };
    });
    saveTasks(tasks);
    set({ tasks });
  },

  archiveOldCompleted: () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const toArchive = get().tasks.filter(
      t => t.status === 'Complete' && t.completedAt && new Date(t.completedAt) < cutoff
    );
    if (toArchive.length === 0) return;
    const archived = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify([...archived, ...toArchive]));
    const tasks = get().tasks.filter(
      t => !(t.status === 'Complete' && t.completedAt && new Date(t.completedAt) < cutoff)
    );
    saveTasks(tasks);
    set({ tasks });
  },

  importTasks: (tasks) => {
    saveTasks(tasks);
    set({ tasks });
  },
}));
