import { useNotificationStore } from '../store/notificationStore';
import { useNavigate } from 'react-router-dom';
import { AlertItem, AlertType } from '../types';
import { format, parseISO } from 'date-fns';

interface NotificationPanelProps {
  onClose: () => void;
}

const typeConfig: Record<AlertType, { label: string; color: string; icon: string }> = {
  overdue:            { label: 'Overdue',       color: 'text-red-600 bg-red-50',    icon: '🔴' },
  'due-today':        { label: 'Due Today',     color: 'text-amber-700 bg-amber-50', icon: '🟡' },
  'at-risk':          { label: 'At Risk',       color: 'text-orange-600 bg-orange-50', icon: '🟠' },
  'milestone-due-soon': { label: 'Milestone',   color: 'text-blue-600 bg-blue-50',  icon: '🔵' },
};

const typeOrder: AlertType[] = ['overdue', 'due-today', 'at-risk', 'milestone-due-soon'];

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { alerts, dismissed, dismissAlert, clearAll } = useNotificationStore();
  const navigate = useNavigate();

  const active = alerts.filter(a => !dismissed.has(a.id));
  const grouped = typeOrder.reduce((acc, type) => {
    acc[type] = active.filter(a => a.type === type);
    return acc;
  }, {} as Record<AlertType, AlertItem[]>);

  function handleAlertClick(alert: AlertItem) {
    navigate(`/tasks?task=${alert.taskId}`);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-slate-900">
          <h2 className="font-semibold text-white">Notifications</h2>
          <div className="flex items-center gap-3">
            {active.length > 0 && (
              <button onClick={clearAll} className="text-xs text-slate-400 hover:text-white transition-colors">
                Clear All
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-lg leading-none">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {active.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
              <span className="text-4xl mb-3">✓</span>
              <p className="text-sm font-medium">All clear! No active alerts.</p>
            </div>
          ) : (
            typeOrder.map(type => {
              const items = grouped[type];
              if (items.length === 0) return null;
              const cfg = typeConfig[type];
              return (
                <div key={type} className="border-b border-gray-100 last:border-0">
                  <div className={`px-4 py-2 flex items-center gap-2 ${cfg.color}`}>
                    <span>{cfg.icon}</span>
                    <span className="text-xs font-semibold uppercase tracking-wide">{cfg.label} ({items.length})</span>
                  </div>
                  {items.map(alert => (
                    <div
                      key={alert.id}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-start justify-between gap-2 group"
                      onClick={() => handleAlertClick(alert)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{alert.taskTitle}</p>
                        {alert.milestoneName && (
                          <p className="text-xs text-gray-500">Milestone: {alert.milestoneName}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">{format(parseISO(alert.date), 'MMM d, yyyy')}</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); dismissAlert(alert.id); }}
                        className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
                        aria-label="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
