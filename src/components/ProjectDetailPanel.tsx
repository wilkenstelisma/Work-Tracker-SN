import { useState, useMemo } from 'react';
import { Project, ProjectStatus, Task } from '../types';
import { useProjectStore } from '../store/projectStore';
import { useTaskStore } from '../store/taskStore';
import { format, parseISO, isBefore, isToday } from 'date-fns';
import TaskDetailPanel from './TaskDetailPanel';
import ProjectForm from './ProjectForm';

interface ProjectDetailPanelProps {
  project: Project;
  onClose: () => void;
  onNewTask: (projectId: string) => void;
}

type Tab = 'details' | 'tasks' | 'progress';

const statusColors: Record<ProjectStatus, string> = {
  Planning: 'bg-gray-100 text-gray-700',
  Active: 'bg-blue-100 text-blue-700',
  'On Hold': 'bg-yellow-100 text-yellow-700',
  Complete: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const priorityColors: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Medium: 'bg-blue-100 text-blue-700',
  Low: 'bg-gray-100 text-gray-600',
};

const taskStatusColors: Record<string, string> = {
  'Not Started': 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Blocked': 'bg-red-100 text-red-700',
  'Under Review': 'bg-yellow-100 text-yellow-700',
  'Complete': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-gray-100 text-gray-400',
};

const ALL_TASK_STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Under Review', 'Complete', 'Cancelled'];

export default function ProjectDetailPanel({ project, onClose, onNewTask }: ProjectDetailPanelProps) {
  const { updateProject, deleteProject } = useProjectStore();
  const { tasks, updateTask } = useTaskStore();
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Live project data (re-reads from store so edits reflect immediately)
  const live = useProjectStore(s => s.projects.find(p => p.id === project.id) ?? project);

  const projectTasks = useMemo(
    () => tasks.filter(t => t.projectId === live.id),
    [tasks, live.id]
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completedCount = projectTasks.filter(t => t.status === 'Complete').length;
  const totalCount = projectTasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const overdueCount = projectTasks.filter(t =>
    t.status !== 'Complete' && t.status !== 'Cancelled' &&
    isBefore(parseISO(t.dueDate), today) && !isToday(parseISO(t.dueDate))
  ).length;

  function handleEditSave(data: Partial<Project>) {
    updateProject(live.id, data);
    setIsEditing(false);
  }

  function handleDelete() {
    // Clear projectId from all linked tasks
    projectTasks.forEach(t => updateTask(t.id, { projectId: undefined }));
    deleteProject(live.id);
    onClose();
  }

  function handleUnlinkTask(taskId: string) {
    updateTask(taskId, { projectId: undefined });
  }

  return (
    <>
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl flex flex-col z-40 border-l border-gray-200">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[live.status]}`}>
                {live.status}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[live.priority]}`}>
                {live.priority}
              </span>
            </div>
            <h2 className="text-base font-semibold text-slate-800 mt-1 leading-tight">{live.name}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium"
            >
              Delete
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-1">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          {(['details', 'tasks', 'progress'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'tasks' ? `Tasks (${totalCount})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <>
              {live.description && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{live.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {live.targetDate && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Target Date</h4>
                    <p className="text-sm text-slate-700">{format(parseISO(live.targetDate), 'MMM d, yyyy')}</p>
                  </div>
                )}
                {live.startDate && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Start Date</h4>
                    <p className="text-sm text-slate-700">{format(parseISO(live.startDate), 'MMM d, yyyy')}</p>
                  </div>
                )}
                {live.owner && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Owner / Lead</h4>
                    <p className="text-sm text-slate-700">{live.owner}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created</h4>
                  <p className="text-sm text-slate-700">{format(parseISO(live.createdAt), 'MMM d, yyyy')}</p>
                </div>
              </div>

              {/* Progress snapshot */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Task Progress</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 whitespace-nowrap">{completedCount}/{totalCount} complete</span>
                </div>
              </div>

              {/* Related Links */}
              {live.links.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Related Links</h4>
                  <div className="space-y-1.5">
                    {live.links.map(l => (
                      <a
                        key={l.id}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline group"
                      >
                        <span className="text-blue-400 flex-shrink-0">🔗</span>
                        <span className="truncate">{l.label}</span>
                        <span className="text-xs text-gray-400 truncate hidden group-hover:inline max-w-[180px]">{l.url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <>
              {projectTasks.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm">No tasks linked to this project yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projectTasks.map(task => {
                    const isOverdue =
                      task.status !== 'Complete' && task.status !== 'Cancelled' &&
                      isBefore(parseISO(task.dueDate), today) && !isToday(parseISO(task.dueDate));
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                      >
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => setSelectedTask(task)}
                        >
                          <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${taskStatusColors[task.status]}`}>
                              {task.status}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                              {task.priority}
                            </span>
                            <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                              {isOverdue ? '⚠ ' : ''}Due {format(parseISO(task.dueDate), 'MMM d')}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnlinkTask(task.id)}
                          title="Unlink from project"
                          className="text-gray-300 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 px-1"
                        >
                          Unlink
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => onNewTask(live.id)}
                className="w-full mt-2 py-2 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-sm text-gray-500 hover:text-blue-600 rounded-lg transition-colors"
              >
                + Add Task to Project
              </button>
            </>
          )}

          {/* PROGRESS TAB */}
          {activeTab === 'progress' && (
            <>
              {/* Overall progress */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Overall Completion</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{progressPct}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{completedCount} of {totalCount} tasks complete</p>
              </div>

              {/* Status breakdown */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tasks by Status</h4>
                {totalCount === 0 ? (
                  <p className="text-sm text-gray-400">No tasks linked yet.</p>
                ) : (
                  <div className="space-y-2">
                    {ALL_TASK_STATUSES.map(s => {
                      const count = projectTasks.filter(t => t.status === s).length;
                      if (count === 0) return null;
                      const pct = Math.round((count / totalCount) * 100);
                      return (
                        <div key={s} className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full w-28 text-center flex-shrink-0 ${taskStatusColors[s]}`}>
                            {s}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-600 w-8 text-right flex-shrink-0">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <p className="text-2xl font-bold text-slate-800">{totalCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Total Tasks</p>
                </div>
                <div className={`rounded-xl p-3 border ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>{overdueCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Overdue</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Complete</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                  <p className="text-2xl font-bold text-blue-600">{projectTasks.filter(t => t.status === 'In Progress').length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">In Progress</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="font-semibold text-slate-800 text-lg mb-4">Edit Project</h3>
            <ProjectForm initial={live} onSubmit={handleEditSave} onCancel={() => setIsEditing(false)} isEdit />
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 text-base mb-2">Delete Project?</h3>
            <p className="text-sm text-gray-600 mb-4">
              "{live.name}" will be permanently deleted. The {totalCount} linked task{totalCount !== 1 ? 's' : ''} will remain but will be unlinked from this project.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Task detail panel when clicking a task row */}
      {selectedTask && <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </>
  );
}
