import { useState } from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import NotificationPanel from '../NotificationPanel';

interface TopNavProps {
  onNewTask: () => void;
  pageTitle: string;
}

export default function TopNav({ onNewTask, pageTitle }: TopNavProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { alerts, dismissed } = useNotificationStore();
  const activeAlerts = alerts.filter(a => !dismissed.has(a.id));

  return (
    <>
      <header className="h-16 bg-slate-900 flex items-center justify-between px-6 flex-shrink-0 border-b border-slate-700">
        <h1 className="text-white font-semibold text-lg">{pageTitle}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={onNewTask}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Task
          </button>
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Notifications"
          >
            <span className="text-xl">🔔</span>
            {activeAlerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
}
