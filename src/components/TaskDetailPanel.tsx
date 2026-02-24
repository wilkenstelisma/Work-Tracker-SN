import { useState } from 'react';
import { Task, TaskStatus, Priority, TaskType, Milestone } from '../types';
import { useTaskStore } from '../store/taskStore';
import { format, parseISO } from 'date-fns';
import MilestoneTimeline from './MilestoneTimeline';
import TaskForm from './TaskForm';
import toast from 'react-hot-toast';

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
}

const priorityBadge: Record<Priority, string> = {
  Critical: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Medium: 'bg-blue-100 text-blue-700',
  Low: 'bg-gray-100 text-gray-600',
};

const statusColors: Record<TaskStatus, string> = {
  'Not Started': 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Blocked': 'bg-red-100 text-red-700',
  'Under Review': 'bg-yellow-100 text-yellow-700',
  'Complete': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-gray-100 text-gray-400',
};

const STATUSES: TaskStatus[] = ['Not Started', 'In Progress', 'Blocked', 'Under Review', 'Complete', 'Cancelled'];
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
const TYPES: TaskType[] = ['System Admin', 'Digital Transformation', 'Audit Support', 'Risk Management', 'Reporting', 'Stakeholder Engagement', 'Ad-hoc', 'Custom'];

type Tab = 'details' | 'subtasks' | 'milestones' | 'updates' | 'history';

export default function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  const { updateTask, deleteTask, addUpdate, toggleSubtask, addSubtask, deleteSubtask, addMilestone, updateMilestone, deleteMilestone } = useTaskStore();
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [newUpdate, setNewUpdate] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showChangelogFull, setShowChangelogFull] = useState(false);

  // Get the latest task from store to always show fresh data
  const { tasks } = useTaskStore();
  const live = tasks.find(t => t.id === task.id) || task;

  const done = live.subtasks.filter(s => s.status === 'Done').length;
  const total = live.subtasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  function handleStatusChange(status: TaskStatus) {
    updateTask(live.id, { status });
    toast.success(`Status updated to ${status}`);
  }

  function handleAddUpdate() {
    if (!newUpdate.trim()) return;
    addUpdate(live.id, newUpdate.trim());
    setNewUpdate('');
    toast.success('Update logged');
  }

  function handleAddSubtask() {
    if (!newSubtaskTitle.trim()) return;
    addSubtask(live.id, { title: newSubtaskTitle.trim(), status: 'Open' });
    setNewSubtaskTitle('');
  }

  function handleAddMilestone() {
    const name = prompt('Milestone name:');
    const date = prompt('Target date (YYYY-MM-DD):');
    if (name && date) {
      addMilestone(live.id, { name, targetDate: date, status: 'Upcoming' });
      toast.success('Milestone added');
    }
  }

  function handleDelete() {
    deleteTask(live.id);
    toast.success('Task deleted');
    onClose();
  }

  function handleEditSave(data: Partial<Task>) {
    const { subtasks, milestones, ...rest } = data;
    updateTask(live.id, rest);
    toast.success('Task updated');
    setIsEditing(false);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'subtasks', label: `Subtasks ${total > 0 ? `(${done}/${total})` : ''}` },
    { id: 'milestones', label: `Milestones ${live.milestones.length > 0 ? `(${live.milestones.length})` : ''}` },
    { id: 'updates', label: `Updates ${live.updates.length > 0 ? `(${live.updates.length})` : ''}` },
    { id: 'history', label: 'History' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-slate-900 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-1">{live.taskType}</p>
              <h2 className="text-white font-semibold text-lg leading-tight truncate">{live.title}</h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setIsEditing(true)} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors">Edit</button>
              <button onClick={() => setShowDeleteConfirm(true)} className="text-xs bg-red-900/50 hover:bg-red-800 text-red-300 px-3 py-1.5 rounded-lg transition-colors">Delete</button>
              <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none ml-1">✕</button>
            </div>
          </div>

          {/* Status + Priority row */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <select
              value={live.status}
              onChange={e => handleStatusChange(e.target.value as TaskStatus)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${statusColors[live.status]}`}
            >
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityBadge[live.priority]}`}>
              {live.priority}
            </span>
            <span className="text-xs text-slate-400">Due {format(parseISO(live.dueDate), 'MMM d, yyyy')}</span>
            {live.isRecurring && <span className="text-xs text-blue-300">↻ Recurring</span>}
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{done}/{total} subtasks</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${progress === 100 ? 'bg-green-400' : 'bg-blue-400'}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {live.description && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{live.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {live.startDate && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Start Date</h4>
                    <p className="text-sm text-slate-700">{format(parseISO(live.startDate), 'MMM d, yyyy')}</p>
                  </div>
                )}
                {live.assignee && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Assignee</h4>
                    <p className="text-sm text-slate-700">{live.assignee}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created</h4>
                  <p className="text-sm text-slate-700">{format(parseISO(live.createdAt), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Last Updated</h4>
                  <p className="text-sm text-slate-700">{format(parseISO(live.updatedAt), 'MMM d, HH:mm')}</p>
                </div>
                {live.completedAt && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Completed</h4>
                    <p className="text-sm text-green-700">{format(parseISO(live.completedAt), 'MMM d, yyyy')}</p>
                  </div>
                )}
              </div>
              {live.notes && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{live.notes}</p>
                </div>
              )}
              {live.isRecurring && live.recurrence && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recurrence</h4>
                  <p className="text-sm text-slate-700">
                    {live.recurrence.pattern} · Cycle #{live.recurrence.cycleCount + 1}
                    {live.recurrence.lastCompleted && ` · Last completed: ${format(parseISO(live.recurrence.lastCompleted), 'MMM d, yyyy')}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SUBTASKS TAB */}
          {activeTab === 'subtasks' && (
            <div className="space-y-3">
              {live.subtasks.length === 0 && (
                <p className="text-sm text-gray-400 italic">No subtasks yet.</p>
              )}
              {live.subtasks.map(s => (
                <div key={s.id} className="flex items-center gap-3 group py-1.5 border-b border-gray-100 last:border-0">
                  <input
                    type="checkbox"
                    checked={s.status === 'Done'}
                    onChange={() => toggleSubtask(live.id, s.id)}
                    className="w-4 h-4 accent-blue-600 flex-shrink-0"
                  />
                  <span className={`text-sm flex-1 ${s.status === 'Done' ? 'line-through text-gray-400' : 'text-slate-700'}`}>
                    {s.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask(live.id, s.id)}
                    className="text-gray-300 hover:text-red-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add subtask..."
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                />
                <button onClick={handleAddSubtask} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">Add</button>
              </div>
            </div>
          )}

          {/* MILESTONES TAB */}
          {activeTab === 'milestones' && (
            <div>
              <MilestoneTimeline
                milestones={live.milestones}
                onUpdate={(msId, updates) => updateMilestone(live.id, msId, updates)}
                onDelete={(msId) => deleteMilestone(live.id, msId)}
              />
              <button onClick={handleAddMilestone} className="mt-4 w-full py-2 border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 rounded-lg transition-colors">
                + Add Milestone
              </button>
            </div>
          )}

          {/* UPDATES TAB */}
          {activeTab === 'updates' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <textarea
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  placeholder="Log a progress update..."
                  value={newUpdate}
                  onChange={e => setNewUpdate(e.target.value)}
                />
                <button onClick={handleAddUpdate} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors self-end">Log</button>
              </div>
              {live.updates.length === 0 && <p className="text-sm text-gray-400 italic">No updates logged yet.</p>}
              <div className="space-y-3">
                {live.updates.map(u => (
                  <div key={u.id} className="border-l-2 border-blue-200 pl-3 py-1">
                    <p className="text-xs text-gray-400 mb-1">{format(parseISO(u.timestamp), 'MMM d, yyyy · HH:mm')}</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{u.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div>
              <p className="text-xs text-gray-500 mb-3">{live.changelog.length} changelog entries</p>
              <div className="space-y-2">
                {(showChangelogFull ? live.changelog : live.changelog.slice(0, 20))
                  .slice()
                  .reverse()
                  .map(entry => (
                    <div key={entry.id} className="text-xs border-b border-gray-100 pb-2 last:border-0">
                      <span className="text-gray-400">{format(parseISO(entry.timestamp), 'MMM d, HH:mm')} · </span>
                      <span className="font-medium text-gray-700">{entry.field}</span>
                      {entry.oldValue && entry.newValue && entry.field !== 'created' && entry.field !== 'update' && (
                        <span className="text-gray-500"> changed from <span className="text-red-500">{entry.oldValue}</span> to <span className="text-green-600">{entry.newValue}</span></span>
                      )}
                      {entry.field === 'update' && <span className="text-gray-500"> · {entry.newValue.substring(0, 60)}{entry.newValue.length > 60 ? '…' : ''}</span>}
                    </div>
                  ))}
                {live.changelog.length > 20 && !showChangelogFull && (
                  <button onClick={() => setShowChangelogFull(true)} className="text-xs text-blue-600 hover:underline">Show all {live.changelog.length} entries</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <>
          <div className="fixed inset-0 z-60 bg-black/40" onClick={() => setIsEditing(false)} />
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <h3 className="font-semibold text-slate-800 text-lg mb-4">Edit Task</h3>
              <TaskForm initial={live} onSubmit={handleEditSave} onCancel={() => setIsEditing(false)} isEdit />
            </div>
          </div>
        </>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 z-60 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <h3 className="font-semibold text-slate-800 mb-2">Delete Task?</h3>
              <p className="text-sm text-gray-600 mb-5">This will permanently delete "<strong>{live.title}</strong>" and all its data.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Delete</button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
