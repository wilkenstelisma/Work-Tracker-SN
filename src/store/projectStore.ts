import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '../types';

const STORAGE_KEY = 'arc-projects';

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const projects: Project[] = JSON.parse(raw);
    return projects.map(p => ({ ...p, links: p.links ?? [] }));
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

interface ProjectStore {
  projects: Project[];
  createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): string;
  updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): void;
  deleteProject(id: string): void;
}

export const useProjectStore = create<ProjectStore>(() => ({
  projects: loadProjects(),

  createProject(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const project: Project = { ...data, id, createdAt: now, updatedAt: now };
    const projects = [...useProjectStore.getState().projects, project];
    saveProjects(projects);
    useProjectStore.setState({ projects });
    return id;
  },

  updateProject(id, updates) {
    const projects = useProjectStore.getState().projects.map(p =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    saveProjects(projects);
    useProjectStore.setState({ projects });
  },

  deleteProject(id) {
    const projects = useProjectStore.getState().projects.filter(p => p.id !== id);
    saveProjects(projects);
    useProjectStore.setState({ projects });
  },
}));
