import { useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { exportToCSV, exportToPDF, exportBackupJSON } from '../utils/export';
import toast from 'react-hot-toast';
import { Task } from '../types';

const SETTINGS_KEY = 'arc-settings';

interface AppSettings {
  defaultReminderDays: number;
  browserNotifications: boolean;
}

function loadSettings(): Partial<AppSettings> {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') as Partial<AppSettings>; } catch { return {}; }
}

export default function Settings() {
  const { tasks, archiveOldCompleted, importTasks } = useTaskStore();
  const savedSettings = loadSettings();
  const [reminderDays, setReminderDays] = useState(savedSettings.defaultReminderDays ?? 2);
  const [browserNotifs, setBrowserNotifs] = useState(savedSettings.browserNotifications ?? false);

  function saveSettings(updates: Partial<AppSettings>) {
    const settings = { ...loadSettings(), ...updates };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  async function requestNotifPermission() {
    if (!('Notification' in window)) {
      toast.error('Browser notifications not supported.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setBrowserNotifs(true);
      saveSettings({ browserNotifications: true });
      toast.success('Browser notifications enabled!');
    } else {
      toast.error('Notification permission denied.');
    }
  }

  function handleArchive() {
    archiveOldCompleted();
    toast.success('Archived completed tasks older than 90 days.');
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Task[];
        if (!Array.isArray(data)) throw new Error('Invalid format');
        if (window.confirm(`Import ${data.length} tasks? This will REPLACE your current tasks.`)) {
          importTasks(data);
          toast.success(`Imported ${data.length} tasks.`);
        }
      } catch {
        toast.error('Invalid backup file. Please use a JSON backup from this app.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const completedCount = tasks.filter(t => t.status === 'Complete').length;
  const recurringCount = tasks.filter(t => t.isRecurring).length;
  const archivableCount = tasks.filter(t => {
    if (t.status !== 'Complete' || !t.completedAt) return false;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    return new Date(t.completedAt) < cutoff;
  }).length;

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-slate-800">Settings</h2>

      {/* Notifications */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Notification Preferences</h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Default Advance Warning</p>
            <p className="text-xs text-gray-500 mt-0.5">Days before due date to alert for High/Critical tasks</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number" min={0} max={30}
              className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={reminderDays}
              onChange={e => { const v = parseInt(e.target.value) || 0; setReminderDays(v); saveSettings({ defaultReminderDays: v }); }}
            />
            <span className="text-sm text-gray-500">days</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Browser Notifications</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {Notification.permission === 'granted' ? '✓ Permission granted' :
               Notification.permission === 'denied' ? '✕ Permission denied (reset in browser settings)' :
               'Not yet enabled'}
            </p>
          </div>
          <button
            onClick={requestNotifPermission}
            disabled={Notification.permission === 'granted'}
            className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
              Notification.permission === 'granted'
                ? 'border-green-300 text-green-700 bg-green-50 cursor-default'
                : 'border-blue-300 text-blue-700 hover:bg-blue-50'
            }`}
          >
            {Notification.permission === 'granted' ? 'Enabled' : 'Enable'}
          </button>
        </div>
      </section>

      {/* Data & Storage */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Data & Storage</h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-800">{tasks.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Tasks</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-700">{completedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{recurringCount}</p>
            <p className="text-xs text-gray-500 mt-1">Recurring</p>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <div>
            <p className="text-sm font-medium text-slate-700">Archive Old Completed Tasks</p>
            <p className="text-xs text-gray-500 mt-0.5">{archivableCount} task{archivableCount !== 1 ? 's' : ''} eligible (completed 90+ days ago)</p>
          </div>
          <button
            onClick={handleArchive}
            disabled={archivableCount === 0}
            className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Archive
          </button>
        </div>
      </section>

      {/* Export */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Export</h3>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { exportToCSV(tasks); toast.success('CSV exported!'); }}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span>📄</span> Export CSV
          </button>
          <button
            onClick={() => { exportToPDF(tasks); toast.success('PDF export started!'); }}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span>📋</span> Export PDF
          </button>
          <button
            onClick={() => { exportBackupJSON(tasks); toast.success('Backup downloaded!'); }}
            className="flex items-center gap-2 px-4 py-2.5 border border-blue-300 rounded-lg text-sm text-blue-700 hover:bg-blue-50 transition-colors"
          >
            <span>💾</span> Download Backup (JSON)
          </button>
        </div>
      </section>

      {/* Import */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Import</h3>
        <p className="text-xs text-gray-500">Restore from a JSON backup file. <strong>Warning:</strong> this replaces all current tasks.</p>
        <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-colors w-fit">
          <span>📁</span> Choose Backup File
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </section>

      {/* About */}
      <section className="bg-slate-900 rounded-xl p-5 text-slate-400 text-xs space-y-1">
        <p className="text-white font-medium text-sm">ARC Task Tracker v1.0</p>
        <p>Built for Wilkens · System Administrator & Digital Transformation Lead</p>
        <p>Data stored locally in your browser · No external servers</p>
      </section>
    </div>
  );
}
