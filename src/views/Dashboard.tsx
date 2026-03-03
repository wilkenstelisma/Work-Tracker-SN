import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/taskStore';
import { isToday, isBefore, addDays, isAfter, parseISO, isThisWeek, isThisMonth, format } from 'date-fns';
import DashboardWidget from '../components/DashboardWidget';
import TaskCard from '../components/TaskCard';
import TaskDetailPanel from '../components/TaskDetailPanel';
import { Task } from '../types';

interface MilestoneRow {
  milestoneId: string;
  milestoneName: string;
  taskId: string;
  taskTitle: string;
  date: string;
  task: Task;
}

export default function Dashboard() {
  const { tasks } = useTaskStore();
  const navigate = useNavigate();
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

  // Milestone rows: only from active (non-Complete, non-Cancelled) tasks
  const milestoneSections = useMemo(() => {
    const overdueMilestones: MilestoneRow[] = [];
    const dueSoonMilestones: MilestoneRow[] = [];

    for (const task of active) {
      if (task.status === 'Complete') continue;
      for (const ms of task.milestones) {
        if (ms.status === 'Achieved' || ms.status === 'Missed') continue;
        const msDate = parseISO(ms.targetDate);
        msDate.setHours(0, 0, 0, 0);
        const row: MilestoneRow = {
          milestoneId: ms.id,
          milestoneName: ms.name,
          taskId: task.id,
          taskTitle: task.title,
          date: ms.targetDate,
          task,
        };
        if (isBefore(msDate, today)) {
          overdueMilestones.push(row);
        } else if (isAfter(addDays(today, 3), msDate)) {
          dueSoonMilestones.push(row);
        }
      }
    }

    overdueMilestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    dueSoonMilestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { overdueMilestones, dueSoonMilestones };
  }, [tasks]);

  const { overdueMilestones, dueSoonMilestones } = milestoneSections;

  const openCount = active.filter(t => t.status !== 'Complete').length;
  const dueThisWeek = active.filter(t => t.status !== 'Complete' && isThisWeek(parseISO(t.dueDate), { weekStartsOn: 1 })).length;
  const completedThisMonth = tasks.filter(t => t.status === 'Complete' && t.completedAt && isThisMonth(parseISO(t.completedAt))).length;

  const allClear = overdue.length === 0 && dueToday.length === 0 && overdueMilestones.length === 0 && dueSoonMilestones.length === 0;

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
        <DashboardWidget
          label="Total Open"
          count={openCount}
          color="blue"
          icon="📋"
          onClick={() => navigate('/tasks?filter=open')}
        />
        <DashboardWidget
          label="Overdue"
          count={overdue.length}
          color="red"
          icon="⚠️"
          sublabel="Needs immediate attention"
          onClick={() => navigate('/tasks?filter=overdue')}
        />
        <DashboardWidget
          label="Due This Week"
          count={dueThisWeek}
          color="orange"
          icon="📅"
          onClick={() => navigate('/tasks?filter=due-this-week')}
        />
        <DashboardWidget
          label="Completed This Month"
          count={completedThisMonth}
          color="green"
          icon="✅"
          onClick={() => navigate('/tasks?filter=completed-month')}
        />
      </div>

      {/* Overdue Tasks */}
      {overdue.length > 0 && (
        <section>
          <button
            onClick={() => navigate('/tasks?filter=overdue')}
            className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2 hover:text-red-800 transition-colors"
          >
            <span>⚠</span> Overdue ({overdue.length})
            <span className="text-xs normal-case font-normal opacity-60 ml-1">View all →</span>
          </button>
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
          <button
            onClick={() => navigate('/tasks?filter=due-today')}
            className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3 flex items-center gap-2 hover:text-amber-800 transition-colors"
          >
            <span>📅</span> Due Today ({dueToday.length})
            <span className="text-xs normal-case font-normal opacity-60 ml-1">View all →</span>
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dueToday.map(task => (
              <TaskCard key={task.id} task={task} onClick={setSelectedTask} />
            ))}
          </div>
        </section>
      )}

      {/* Overdue Milestones */}
      {overdueMilestones.length > 0 && (
        <section>
          <p className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span>🚩</span> Overdue Milestones ({overdueMilestones.length})
          </p>
          <div className="space-y-2">
            {overdueMilestones.map(row => (
              <div
                key={row.milestoneId}
                onClick={() => setSelectedTask(row.task)}
                className="flex items-center justify-between px-4 py-3 bg-white border border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50 cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{row.milestoneName}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{row.taskTitle}</p>
                </div>
                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex-shrink-0 ml-3">
                  {format(parseISO(row.date), 'MMM d')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Milestones Due Soon */}
      {dueSoonMilestones.length > 0 && (
        <section>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span>🔵</span> Milestones Due Soon ({dueSoonMilestones.length})
          </p>
          <div className="space-y-2">
            {dueSoonMilestones.map(row => (
              <div
                key={row.milestoneId}
                onClick={() => setSelectedTask(row.task)}
                className="flex items-center justify-between px-4 py-3 bg-white border border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{row.milestoneName}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{row.taskTitle}</p>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0 ml-3">
                  {format(parseISO(row.date), 'MMM d')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {allClear && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">✓</div>
          <p className="text-lg font-medium text-gray-500">All clear for today!</p>
          <p className="text-sm mt-1">No overdue or due-today tasks or milestones.</p>
        </div>
      )}

      {selectedTask && <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
