import { useState } from 'react';
import { Task, TaskType, TaskStatus, Priority, Subtask, Milestone, MilestoneStatus, RecurrenceConfig, TaskLink } from '../types';
import { v4 as uuidv4 } from 'uuid';
import RecurrenceConfigComp from './RecurrenceConfig';

interface TaskFormProps {
  initial?: Partial<Task>;
  onSubmit: (data: Partial<Task>) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const TASK_TYPES: TaskType[] = [
  'System Admin', 'Digital Transformation', 'Audit Support', 'Risk Management',
  'Reporting', 'Stakeholder Engagement', 'Ad-hoc', 'Custom',
];
const STATUSES: TaskStatus[] = ['Not Started', 'In Progress', 'Blocked', 'Under Review', 'Complete', 'Cancelled'];
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
const MS_STATUSES: MilestoneStatus[] = ['Upcoming', 'In Progress', 'Achieved', 'Missed'];

const defaultRecurrence: RecurrenceConfig = { pattern: 'Weekly', interval: 1, cycleCount: 0 };

export default function TaskForm({ initial = {}, onSubmit, onCancel, isEdit = false }: TaskFormProps) {
  const [title, setTitle] = useState(initial.title || '');
  const [description, setDescription] = useState(initial.description || '');
  const [taskType, setTaskType] = useState<TaskType>(initial.taskType || 'System Admin');
  const [status, setStatus] = useState<TaskStatus>(initial.status || 'Not Started');
  const [priority, setPriority] = useState<Priority>(initial.priority || 'Medium');
  const [dueDate, setDueDate] = useState(initial.dueDate || '');
  const [startDate, setStartDate] = useState(initial.startDate || '');
  const [assignee, setAssignee] = useState(initial.assignee || '');
  const [notes, setNotes] = useState(initial.notes || '');
  const [reminderDays, setReminderDays] = useState(initial.reminderDays ?? 2);
  const [isRecurring, setIsRecurring] = useState(initial.isRecurring || false);
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>(initial.recurrence || defaultRecurrence);
  const [subtasks, setSubtasks] = useState<Subtask[]>(initial.subtasks || []);
  const [milestones, setMilestones] = useState<Milestone[]>(initial.milestones || []);
  const [links, setLinks] = useState<TaskLink[]>(initial.links || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [newMsName, setNewMsName] = useState('');
  const [newMsDate, setNewMsDate] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!dueDate) e.dueDate = 'Due date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      title: title.trim(), description, taskType, status, priority,
      dueDate, startDate: startDate || undefined, assignee: assignee || undefined,
      notes, reminderDays, isRecurring,
      recurrence: isRecurring ? recurrence : undefined,
      subtasks, milestones, links,
    });
  }

  function addSubtask() {
    if (!newSubtask.trim()) return;
    setSubtasks(s => [...s, { id: uuidv4(), title: newSubtask.trim(), status: 'Open' }]);
    setNewSubtask('');
  }

  function addMilestone() {
    if (!newMsName.trim() || !newMsDate) return;
    setMilestones(m => [...m, { id: uuidv4(), name: newMsName.trim(), targetDate: newMsDate, status: 'Upcoming' }]);
    setNewMsName('');
    setNewMsDate('');
  }

  function addLink() {
    if (!newLinkUrl.trim()) return;
    const raw = newLinkUrl.trim();
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    setLinks(l => [...l, { id: uuidv4(), label: newLinkLabel.trim() || raw, url }]);
    setNewLinkUrl('');
    setNewLinkLabel('');
  }

  const fieldCls = (name: string) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[name] ? 'border-red-400' : 'border-gray-300'
    }`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Title <span className="text-red-500">*</span></label>
        <input
          className={fieldCls('title')}
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Task title"
          maxLength={200}
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
      </div>

      {/* Row: Type + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
          <select className={fieldCls('')} value={taskType} onChange={e => setTaskType(e.target.value as TaskType)}>
            {TASK_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
          <select className={fieldCls('')} value={priority} onChange={e => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Row: Status + Due Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
          <select className={fieldCls('')} value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date <span className="text-red-500">*</span></label>
          <input type="date" className={fieldCls('dueDate')} value={dueDate} onChange={e => setDueDate(e.target.value)} />
          {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
        </div>
      </div>

      {/* Row: Start Date + Assignee */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
          <input type="date" className={fieldCls('')} value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
          <input className={fieldCls('')} value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Wilkens" />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
        <textarea className={fieldCls('')} value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional description..." />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
        <textarea className={fieldCls('')} value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Freeform notes, links, decisions..." />
      </div>

      {/* Reminder Days */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">Alert me</label>
        <input
          type="number" min={0} max={30}
          className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={reminderDays} onChange={e => setReminderDays(parseInt(e.target.value) || 0)}
        />
        <span className="text-xs text-gray-500">days before due date (for High/Critical tasks)</span>
      </div>

      {/* Recurring */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="w-4 h-4 accent-blue-600" />
          <span className="text-xs font-semibold text-slate-700">Recurring Task</span>
        </label>
        {isRecurring && (
          <div className="mt-2">
            <RecurrenceConfigComp value={recurrence} onChange={setRecurrence} baseDueDate={dueDate} />
          </div>
        )}
      </div>

      {/* Subtasks */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">Subtasks</label>
        <div className="space-y-1.5 mb-2">
          {subtasks.map(s => (
            <div key={s.id} className="flex items-center gap-2 group">
              <input
                type="checkbox"
                checked={s.status === 'Done'}
                onChange={() => setSubtasks(sub => sub.map(x => x.id === s.id ? { ...x, status: x.status === 'Done' ? 'Open' : 'Done' } : x))}
                className="w-4 h-4 accent-blue-600"
              />
              <span className={`text-sm flex-1 ${s.status === 'Done' ? 'line-through text-gray-400' : 'text-slate-700'}`}>{s.title}</span>
              <button type="button" onClick={() => setSubtasks(sub => sub.filter(x => x.id !== s.id))} className="text-gray-300 hover:text-red-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add subtask..."
            value={newSubtask}
            onChange={e => setNewSubtask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
          />
          <button type="button" onClick={addSubtask} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors">Add</button>
        </div>
      </div>

      {/* Milestones */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">Milestones</label>
        <div className="space-y-1.5 mb-2">
          {milestones.map(m => (
            <div key={m.id} className="flex items-center gap-2 group">
              <span className="text-sm flex-1 text-slate-700">{m.name}</span>
              <input type="date" value={m.targetDate} onChange={e => setMilestones(ms => ms.map(x => x.id === m.id ? { ...x, targetDate: e.target.value } : x))} className="text-xs border border-gray-200 rounded px-2 py-1" />
              <select value={m.status} onChange={e => setMilestones(ms => ms.map(x => x.id === m.id ? { ...x, status: e.target.value as MilestoneStatus } : x))} className="text-xs border border-gray-200 rounded px-1 py-1">
                {MS_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <button type="button" onClick={() => setMilestones(ms => ms.filter(x => x.id !== m.id))} className="text-gray-300 hover:text-red-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Milestone name..." value={newMsName} onChange={e => setNewMsName(e.target.value)} />
          <input type="date" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={newMsDate} onChange={e => setNewMsDate(e.target.value)} />
          <button type="button" onClick={addMilestone} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors">Add</button>
        </div>
      </div>

      {/* Related Links */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">Related Links</label>
        <div className="space-y-1.5 mb-2">
          {links.map(l => (
            <div key={l.id} className="flex items-center gap-2 group">
              <span className="text-blue-500 text-xs flex-shrink-0">🔗</span>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex-1 truncate"
                onClick={e => e.stopPropagation()}
              >
                {l.label}
              </a>
              <button
                type="button"
                onClick={() => setLinks(ls => ls.filter(x => x.id !== l.id))}
                className="text-gray-300 hover:text-red-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="w-36 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Label (optional)"
            value={newLinkLabel}
            onChange={e => setNewLinkLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())}
          />
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
            value={newLinkUrl}
            onChange={e => setNewLinkUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())}
          />
          <button
            type="button"
            onClick={addLink}
            disabled={!newLinkUrl.trim()}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
        <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          {isEdit ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
