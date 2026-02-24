import { useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { format, parseISO } from 'date-fns';
import TaskDetailPanel from '../components/TaskDetailPanel';
import { Task } from '../types';

export default function RecurringTasks() {
  const { tasks, updateTask } = useTaskStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const recurring = tasks.filter(t => t.isRecurring);
  const active = recurring.filter(t => !t.isPaused);
  const paused = recurring.filter(t => t.isPaused);

  function togglePause(task: Task) {
    updateTask(task.id, { isPaused: !task.isPaused });
  }

  function RecurringRow({ task }: { task: Task }) {
    const rec = task.recurrence;
    return (
      <div
        className={`bg-white border rounded-xl p-4 flex items-center justify-between gap-4 ${
          task.isPaused ? 'opacity-60 border-gray-200' : 'border-gray-200 hover:border-blue-200'
        }`}
      >
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedTask(task)}>
          <div className="flex items-center gap-2">
            <span className="text-blue-500 font-bold text-sm">↻</span>
            <p className="font-medium text-slate-800 truncate">{task.title}</p>
            {task.isPaused && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Paused</span>}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
            <span>{task.taskType}</span>
            <span>·</span>
            <span>{rec?.pattern}{rec?.pattern === 'Custom' || rec?.pattern === 'Daily' ? ` (every ${rec.interval} days)` : ''}</span>
            <span>·</span>
            <span>Due: {format(parseISO(task.dueDate), 'MMM d, yyyy')}</span>
            {rec?.cycleCount !== undefined && rec.cycleCount > 0 && (
              <>
                <span>·</span>
                <span className="text-blue-600 font-medium">{rec.cycleCount} cycle{rec.cycleCount !== 1 ? 's' : ''} completed</span>
              </>
            )}
            {rec?.lastCompleted && (
              <>
                <span>·</span>
                <span>Last done: {format(parseISO(rec.lastCompleted), 'MMM d, yyyy')}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full ${
            task.status === 'Complete' ? 'bg-green-100 text-green-700' :
            task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {task.status}
          </span>
          <button
            onClick={() => togglePause(task)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              task.isPaused
                ? 'border-blue-300 text-blue-600 hover:bg-blue-50'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {task.isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => setSelectedTask(task)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Recurring Tasks</h2>
        <p className="text-sm text-gray-500 mt-1">{recurring.length} recurring task{recurring.length !== 1 ? 's' : ''} · {active.length} active, {paused.length} paused</p>
      </div>

      {recurring.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">↻</div>
          <p className="text-lg font-medium text-gray-500">No recurring tasks yet.</p>
          <p className="text-sm mt-1">Create a task and enable "Recurring Task" to see it here.</p>
        </div>
      )}

      {active.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Active</h3>
          <div className="space-y-3">
            {active.map(t => <RecurringRow key={t.id} task={t} />)}
          </div>
        </section>
      )}

      {paused.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Paused</h3>
          <div className="space-y-3">
            {paused.map(t => <RecurringRow key={t.id} task={t} />)}
          </div>
        </section>
      )}

      {selectedTask && <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
