import { useState, useMemo } from 'react';
import { useTaskStore } from '../store/taskStore';
import { isToday, isBefore, parseISO, isThisWeek, isThisMonth } from 'date-fns';
import DashboardWidget from '../components/DashboardWidget';
import TaskCard from '../components/TaskCard';
import TaskDetailPanel from '../components/TaskDetailPanel';
import { Task } from '../types';

export default function Dashboard() {
  const { tasks } = useTaskStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const active = tasks.filter(t => t.status !== 'Cancelled');

  const overdue = useMemo(() =>
    active.filter(t =>
      t.status !== 'Complete' &&
      isBefore(parseISO(t.dueDate), today) &&
      !isToday(parseISO(t.dueDate))
    ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [tasks]
  );

  const dueToday = useMemo(() =>
    active.filter(t => t.status !== 'Complete' && isToday(parseISO(t.dueDate))),
    [tasks]
  );

  const openCount = active.filter(t => t.status !== 'Complete').length;
  const dueThisWeek = active.filter(t => t.status !== 'Complete' && isThisWeek(parseISO(t.dueDate), { weekStartsOn: 1 })).length;
  const completedThisMonth = tasks.filter(t => t.status === 'Complete' && t.completedAt && isThisMonth(parseISO(t.completedAt))).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Today's Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardWidget label="Total Open" count={openCount} color="blue" icon="📋" />
        <DashboardWidget label="Overdue" count={overdue.length} color="red" icon="⚠️" sublabel="Needs immediate attention" />
        <DashboardWidget label="Due This Week" count={dueThisWeek} color="orange" icon="📅" />
        <DashboardWidget label="Completed This Month" count={completedThisMonth} color="green" icon="✅" />
      </div>

      {/* Overdue Tasks */}
      {overdue.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span>⚠</span> Overdue ({overdue.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overdue.map(task => (
              <TaskCard key={task.id} task={task} onClick={setSelectedTask} />
            ))}
          </div>
        </section>
      )}

      {/* Due Today */}
      {dueToday.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span>📅</span> Due Today ({dueToday.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dueToday.map(task => (
              <TaskCard key={task.id} task={task} onClick={setSelectedTask} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {overdue.length === 0 && dueToday.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">✓</div>
          <p className="text-lg font-medium text-gray-500">All clear for today!</p>
          <p className="text-sm mt-1">No overdue or due-today tasks.</p>
        </div>
      )}

      {selectedTask && <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
