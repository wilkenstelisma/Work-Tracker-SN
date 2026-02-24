import { useNotificationStore } from '../store/notificationStore';
import { useTaskStore } from '../store/taskStore';
import { useNavigate } from 'react-router-dom';
import { AlertItem, AlertType } from '../types';
import { format, parseISO } from 'date-fns';

const typeConfig: Record<AlertType, { label: string; desc: string; color: string; icon: string; bg: string }> = {
  overdue:              { label: 'Overdue',         desc: 'Past due date, not complete', color: 'text-red-700',    icon: '🔴', bg: 'bg-red-50 border-red-200' },
  'due-today':          { label: 'Due Today',       desc: 'Must be addressed today',     color: 'text-amber-700',  icon: '🟡', bg: 'bg-amber-50 border-amber-200' },
  'at-risk':            { label: 'At Risk',         desc: 'High/Critical, due soon',     color: 'text-orange-700', icon: '🟠', bg: 'bg-orange-50 border-orange-200' },
  'milestone-due-soon': { label: 'Milestone Soon',  desc: 'Milestone within 3 days',     color: 'text-blue-700',   icon: '🔵', bg: 'bg-blue-50 border-blue-200' },
};

const typeOrder: AlertType[] = ['overdue', 'due-today', 'at-risk', 'milestone-due-soon'];

export default function AlertsNotifications() {
  const { alerts, dismissed, dismissAlert, clearAll } = useNotificationStore();
  const { updateTask } = useTaskStore();
  const navigate = useNavigate();

  const active = alerts.filter(a => !dismissed.has(a.id));
  const dismissedItems = alerts.filter(a => dismissed.has(a.id));

  const grouped = typeOrder.reduce((acc, type) => {
    acc[type] = active.filter(a => a.type === type);
    return acc;
  }, {} as Record<AlertType, AlertItem[]>);

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Alerts & Notifications</h2>
          <p className="text-sm text-gray-500 mt-1">{active.length} active alert{active.length !== 1 ? 's' : ''}</p>
        </div>
        {active.length > 0 && (
          <button onClick={clearAll} className="text-sm text-gray-500 hover:text-red-600 transition-colors border border-gray-300 rounded-lg px-3 py-2">
            Clear All
          </button>
        )}
      </div>

      {active.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">✓</div>
          <p className="text-lg font-medium text-gray-500">All clear!</p>
          <p className="text-sm mt-1">No active alerts. Keep up the good work.</p>
        </div>
      ) : (
        typeOrder.map(type => {
          const items = grouped[type];
          if (items.length === 0) return null;
          const cfg = typeConfig[type];
          return (
            <section key={type}>
              <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg border ${cfg.bg}`}>
                <span>{cfg.icon}</span>
                <div>
                  <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label} ({items.length})</p>
                  <p className="text-xs text-gray-500">{cfg.desc}</p>
                </div>
              </div>
              <div className="space-y-2">
                {items.map(alert => (
                  <div
                    key={alert.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4 hover:border-blue-200 transition-colors group"
                  >
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => navigate(`/tasks?task=${alert.taskId}`)}
                    >
                      <p className="font-medium text-slate-800">{alert.taskTitle}</p>
                      {alert.milestoneName && <p className="text-xs text-gray-500 mt-0.5">Milestone: {alert.milestoneName}</p>}
                      <p className="text-xs text-gray-400 mt-1">{format(parseISO(alert.date), 'MMM d, yyyy')}</p>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1 text-lg leading-none"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}

      {dismissedItems.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">{dismissedItems.length} dismissed alert{dismissedItems.length !== 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  );
}
