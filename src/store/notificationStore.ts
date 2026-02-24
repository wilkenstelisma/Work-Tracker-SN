import { create } from 'zustand';
import { AlertItem } from '../types';

const DISMISSED_KEY = 'arc-dismissed';

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
}

interface NotificationStore {
  alerts: AlertItem[];
  dismissed: Set<string>;
  setAlerts: (alerts: AlertItem[]) => void;
  dismissAlert: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  alerts: [],
  dismissed: loadDismissed(),

  setAlerts: (alerts) => set({ alerts }),

  dismissAlert: (id) => {
    const dismissed = new Set(get().dismissed);
    dismissed.add(id);
    saveDismissed(dismissed);
    set({ dismissed });
  },

  clearAll: () => {
    const ids = new Set(get().alerts.map(a => a.id));
    const dismissed = new Set([...get().dismissed, ...ids]);
    saveDismissed(dismissed);
    set({ dismissed });
  },
}));
