import { addDays, addWeeks, addMonths, addQuarters, parseISO, format } from 'date-fns';
import { Task, RecurrencePattern } from '../types';

function nextDueDate(current: string, pattern: RecurrencePattern, interval: number): string {
  const date = parseISO(current);
  let next: Date;
  switch (pattern) {
    case 'Daily':
      next = addDays(date, interval);
      break;
    case 'Weekly':
      next = addWeeks(date, interval);
      break;
    case 'Bi-weekly':
      next = addWeeks(date, 2 * interval);
      break;
    case 'Monthly':
      next = addMonths(date, interval);
      break;
    case 'Quarterly':
      next = addQuarters(date, interval);
      break;
    case 'Custom':
      next = addDays(date, interval);
      break;
    default:
      next = addWeeks(date, 1);
  }
  return format(next, 'yyyy-MM-dd');
}

export function generateNextInstance(task: Task): Partial<Task> {
  if (!task.isRecurring || !task.recurrence) return {};
  const { pattern, interval, cycleCount } = task.recurrence;
  const baseDate = task.dueDate;
  const newDue = nextDueDate(baseDate, pattern, interval);
  return {
    dueDate: newDue,
    status: 'Not Started',
    completedAt: undefined,
    updates: [],
    subtasks: task.subtasks.map(s => ({ ...s, status: 'Open' as const })),
    recurrence: {
      ...task.recurrence,
      lastCompleted: new Date().toISOString(),
      nextDue: newDue,
      cycleCount: (cycleCount || 0) + 1,
    },
  };
}

export function checkAndGenerateRecurring(
  tasks: Task[],
  updateTask: (id: string, updates: Partial<Task>) => void
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const task of tasks) {
    if (!task.isRecurring || task.isPaused || !task.recurrence) continue;
    if (task.status !== 'Complete') continue;
    // Task is complete and recurring — generate next instance inline (update the same task)
    const next = generateNextInstance(task);
    if (next.dueDate) {
      updateTask(task.id, next as Partial<Task>);
    }
  }
}
