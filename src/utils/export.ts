import { Task } from '../types';
import { format, parseISO } from 'date-fns';

function fmt(dateStr?: string): string {
  if (!dateStr) return '';
  try { return format(parseISO(dateStr), 'yyyy-MM-dd'); } catch { return dateStr; }
}

export function exportToCSV(tasks: Task[], filename = 'arc-tasks-export.csv') {
  const headers = [
    'Title', 'Type', 'Status', 'Priority', 'Due Date', 'Start Date',
    'Assignee', 'Description', 'Notes', 'Subtasks Total', 'Subtasks Done',
    'Milestones', 'Is Recurring', 'Created At', 'Updated At', 'Completed At',
  ];
  const rows = tasks.map(t => [
    `"${t.title.replace(/"/g, '""')}"`,
    t.taskType,
    t.status,
    t.priority,
    fmt(t.dueDate),
    fmt(t.startDate),
    t.assignee || '',
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
    t.subtasks.length,
    t.subtasks.filter(s => s.status === 'Done').length,
    t.milestones.length,
    t.isRecurring ? 'Yes' : 'No',
    fmt(t.createdAt),
    fmt(t.updatedAt),
    fmt(t.completedAt),
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(tasks: Task[], filename = 'arc-tasks-export.pdf') {
  import('jspdf').then(({ jsPDF }) => {
    import('jspdf-autotable').then(() => {
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text('ARC Task Tracker — Export', 14, 16);
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 24);

      const columns = ['Title', 'Type', 'Status', 'Priority', 'Due Date', 'Assignee', 'Progress'];
      const rows = tasks.map(t => {
        const done = t.subtasks.filter(s => s.status === 'Done').length;
        const progress = t.subtasks.length > 0 ? `${done}/${t.subtasks.length}` : '-';
        return [t.title, t.taskType, t.status, t.priority, fmt(t.dueDate), t.assignee || '-', progress];
      });

      // @ts-expect-error jspdf-autotable extends prototype
      doc.autoTable({ head: [columns], body: rows, startY: 30, styles: { fontSize: 8 }, headStyles: { fillColor: [30, 41, 59] } });
      doc.save(filename);
    });
  });
}

export function exportBackupJSON(tasks: Task[]) {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arc-tasks-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
