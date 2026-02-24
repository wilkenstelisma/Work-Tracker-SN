import { Task, Priority, TaskStatus } from '../types';
import { format, parseISO, isBefore, isToday } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  className?: string;
}

const priorityBadge: Record<Priority, string> = {
  Critical: 'bg-red-100 text-red-700 border border-red-200',
  High: 'bg-orange-100 text-orange-700 border border-orange-200',
  Medium: 'bg-blue-100 text-blue-700 border border-blue-200',
  Low: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const statusChip: Record<TaskStatus, string> = {
  'Not Started': 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Blocked': 'bg-red-100 text-red-700',
  'Under Review': 'bg-yellow-100 text-yellow-700',
  'Complete': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-gray-100 text-gray-400',
};

const typeColors: Record<string, string> = {
  'System Admin': 'bg-purple-100 text-purple-700',
  'Digital Transformation': 'bg-indigo-100 text-indigo-700',
  'Audit Support': 'bg-teal-100 text-teal-700',
  'Risk Management': 'bg-red-100 text-red-700',
  'Reporting': 'bg-amber-100 text-amber-700',
  'Stakeholder Engagement': 'bg-pink-100 text-pink-700',
  'Ad-hoc': 'bg-gray-100 text-gray-600',
  'Custom': 'bg-slate-100 text-slate-600',
};

function dueDateStyle(dueDate: string, status: TaskStatus) {
  if (status === 'Complete' || status === 'Cancelled') return 'text-gray-400';
  try {
    const d = parseISO(dueDate);
    if (isBefore(d, new Date()) && !isToday(d)) return 'text-red-600 font-semibold';
    if (isToday(d)) return 'text-amber-600 font-semibold';
    return 'text-gray-500';
  } catch {
    return 'text-gray-500';
  }
}

export default function TaskCard({ task, onClick, className = '' }: TaskCardProps) {
  const done = task.subtasks.filter(s => s.status === 'Done').length;
  const total = task.subtasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : null;
  const isOverdue = task.status !== 'Complete' && task.status !== 'Cancelled' &&
    isBefore(parseISO(task.dueDate), new Date()) && !isToday(parseISO(task.dueDate));

  return (
    <div
      onClick={() => onClick(task)}
      className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all hover:border-blue-200 group ${
        isOverdue ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-slate-800 text-sm leading-tight group-hover:text-blue-700 flex-1 min-w-0">
          {task.title}
          {task.isRecurring && <span className="ml-1 text-blue-400 text-xs">↻</span>}
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${priorityBadge[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusChip[task.status]}`}>
          {task.status}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[task.taskType] || 'bg-gray-100 text-gray-600'}`}>
          {task.taskType}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={dueDateStyle(task.dueDate, task.status)}>
          {isOverdue ? '⚠ ' : ''}Due {format(parseISO(task.dueDate), 'MMM d, yyyy')}
        </span>
        {task.milestones.length > 0 && (
          <span className="text-gray-400">{task.milestones.length} milestone{task.milestones.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {progress !== null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Subtasks</span>
            <span>{done}/{total}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
