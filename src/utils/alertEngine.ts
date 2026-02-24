import { isToday, isBefore, addDays, parseISO, isAfter } from 'date-fns';
import { Task, AlertItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

function alertId(type: string, taskId: string, extra?: string) {
  return `${type}:${taskId}${extra ? ':' + extra : ''}`;
}

export function computeAlerts(tasks: Task[]): AlertItem[] {
  const alerts: AlertItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const task of tasks) {
    if (task.status === 'Complete' || task.status === 'Cancelled') continue;

    const due = parseISO(task.dueDate);
    due.setHours(0, 0, 0, 0);

    // Overdue
    if (isBefore(due, today)) {
      alerts.push({
        id: alertId('overdue', task.id),
        type: 'overdue',
        taskId: task.id,
        taskTitle: task.title,
        date: task.dueDate,
      });
    }
    // Due Today
    else if (isToday(due)) {
      alerts.push({
        id: alertId('due-today', task.id),
        type: 'due-today',
        taskId: task.id,
        taskTitle: task.title,
        date: task.dueDate,
      });
    }
    // At Risk: within reminderDays and priority is Critical or High
    else if (
      (task.priority === 'Critical' || task.priority === 'High') &&
      isAfter(today, addDays(due, -(task.reminderDays || 2))) &&
      !isBefore(due, today)
    ) {
      alerts.push({
        id: alertId('at-risk', task.id),
        type: 'at-risk',
        taskId: task.id,
        taskTitle: task.title,
        date: task.dueDate,
      });
    }

    // Milestone Due Soon (within 3 days)
    for (const ms of task.milestones) {
      if (ms.status === 'Achieved' || ms.status === 'Missed') continue;
      const msDate = parseISO(ms.targetDate);
      msDate.setHours(0, 0, 0, 0);
      if (!isBefore(msDate, today) && isAfter(addDays(today, 3), msDate)) {
        alerts.push({
          id: alertId('milestone-due-soon', task.id, ms.id),
          type: 'milestone-due-soon',
          taskId: task.id,
          taskTitle: task.title,
          milestoneId: ms.id,
          milestoneName: ms.name,
          date: ms.targetDate,
        });
      }
    }
  }

  return alerts;
}
