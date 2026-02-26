import { useState, useMemo } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useTaskStore } from '../store/taskStore';
import { Project, ProjectStatus, Priority } from '../types';
import { format, parseISO, isBefore, isToday } from 'date-fns';
import ProjectDetailPanel from '../components/ProjectDetailPanel';
import ProjectForm from '../components/ProjectForm';

const PROJECT_STATUSES: ProjectStatus[] = ['Planning', 'Active', 'On Hold', 'Complete', 'Cancelled'];
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

const statusColors: Record<ProjectStatus, string> = {
  Planning: 'bg-gray-100 text-gray-700 border-gray-300',
  Active: 'bg-blue-100 text-blue-700 border-blue-300',
  'On Hold': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Complete: 'bg-green-100 text-green-700 border-green-300',
  Cancelled: 'bg-red-100 text-red-500 border-red-200',
};

const statusCardColors: Record<ProjectStatus, string> = {
  Planning: 'border-gray-200 hover:border-gray-400',
  Active: 'border-blue-200 hover:border-blue-400',
  'On Hold': 'border-yellow-200 hover:border-yellow-400',
  Complete: 'border-green-200 hover:border-green-400',
  Cancelled: 'border-red-200 hover:border-red-300 opacity-70',
};

const priorityColors: Record<Priority, string> = {
  Critical: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Medium: 'bg-blue-100 text-blue-700',
  Low: 'bg-gray-100 text-gray-600',
};

export default function Projects() {
  const { projects, createProject } = useProjectStore();
  const { tasks } = useTaskStore();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newTaskProjectId, setNewTaskProjectId] = useState<string | null>(null);
  const [filterStatuses, setFilterStatuses] = useState<ProjectStatus[]>([]);
  const [filterPriorities, setFilterPriorities] = useState<Priority[]>([]);
  const [sortBy, setSortBy] = useState<'targetDate' | 'priority' | 'name' | 'createdAt'>('targetDate');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function toggleStatus(s: ProjectStatus) {
    setFilterStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function togglePriority(p: Priority) {
    setFilterPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  const filtered = useMemo(() => {
    let result = [...projects];
    if (filterStatuses.length) result = result.filter(p => filterStatuses.includes(p.status));
    if (filterPriorities.length) result = result.filter(p => filterPriorities.includes(p.priority));
    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'priority') {
        const order: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return order[a.priority] - order[b.priority];
      }
      if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    });
    return result;
  }, [projects, filterStatuses, filterPriorities, sortBy]);

  function getProjectStats(projectId: string) {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const total = projectTasks.length;
    const complete = projectTasks.filter(t => t.status === 'Complete').length;
    const overdue = projectTasks.filter(t =>
      t.status !== 'Complete' && t.status !== 'Cancelled' &&
      isBefore(parseISO(t.dueDate), today) && !isToday(parseISO(t.dueDate))
    ).length;
    const pct = total > 0 ? Math.round((complete / total) * 100) : 0;
    return { total, complete, overdue, pct };
  }

  function handleCreateProject(data: Partial<Project>) {
    if (!data.name || !data.targetDate || !data.status || !data.priority) return;
    createProject({
      name: data.name,
      description: data.description,
      status: data.status,
      priority: data.priority,
      targetDate: data.targetDate,
      startDate: data.startDate,
      owner: data.owner,
      links: data.links || [],
    });
    setShowNewProject(false);
  }

  // When ProjectDetailPanel requests a new task for this project
  function handleNewTask(projectId: string) {
    setNewTaskProjectId(projectId);
  }

  // Live-update selectedProject from store
  const liveSelected = selectedProject
    ? projects.find(p => p.id === selectedProject.id) ?? null
    : null;

  const hasFilters = filterStatuses.length > 0 || filterPriorities.length > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filter / toolbar bar */}
      <div className="p-4 bg-white border-b border-gray-200 space-y-3 flex-shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-base font-semibold text-slate-800 mr-2">Projects</h2>

          {/* Sort */}
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="targetDate">Sort: Target Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="name">Sort: Name</option>
            <option value="createdAt">Sort: Newest</option>
          </select>

          <div className="flex-1" />

          {hasFilters && (
            <button
              onClick={() => { setFilterStatuses([]); setFilterPriorities([]); }}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              ✕ Clear filters
            </button>
          )}

          <button
            onClick={() => setShowNewProject(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + New Project
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {PROJECT_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filterStatuses.includes(s)
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {s}
            </button>
          ))}
          <span className="text-gray-300 text-xs self-center">|</span>
          {PRIORITIES.map(p => (
            <button
              key={p}
              onClick={() => togglePriority(p)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filterPriorities.includes(p)
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {filtered.length} project{filtered.length !== 1 ? 's' : ''}{hasFilters ? ' (filtered)' : ''}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <span className="text-5xl mb-3">📁</span>
            {projects.length === 0 ? (
              <>
                <p className="text-sm font-medium text-gray-500">No projects yet</p>
                <p className="text-xs mt-1">Create a project to group related tasks into an initiative.</p>
                <button
                  onClick={() => setShowNewProject(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  + New Project
                </button>
              </>
            ) : (
              <p className="text-sm">No projects match your filters.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(project => {
              const stats = getProjectStats(project.id);
              const isOverdue =
                project.status !== 'Complete' && project.status !== 'Cancelled' &&
                isBefore(parseISO(project.targetDate), today) && !isToday(parseISO(project.targetDate));

              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md ${statusCardColors[project.status]}`}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 flex-1">{project.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${statusColors[project.status]}`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${priorityColors[project.priority]}`}>
                      {project.priority}
                    </span>
                    <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {isOverdue ? '⚠ Overdue · ' : ''}Due {format(parseISO(project.targetDate), 'MMM d, yyyy')}
                    </span>
                    {project.owner && (
                      <span className="text-xs text-gray-400">· {project.owner}</span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{stats.total} task{stats.total !== 1 ? 's' : ''}</span>
                      <span className="font-medium">{stats.pct}% done</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${stats.pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${stats.pct}%` }}
                      />
                    </div>
                    {stats.overdue > 0 && (
                      <p className="text-xs text-red-500 font-medium">⚠ {stats.overdue} overdue task{stats.overdue !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-lg">New Project</h3>
                <button onClick={() => setShowNewProject(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
            </div>
            <div className="p-6">
              <ProjectForm onSubmit={handleCreateProject} onCancel={() => setShowNewProject(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Add Task to Project — inline quick-add form */}
      {newTaskProjectId && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-slate-800 text-base mb-1">Add Task to Project</h3>
            <p className="text-xs text-gray-500 mb-4">
              To add a task with full details, use the main "New Task" button and select this project from the Project dropdown.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setNewTaskProjectId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {liveSelected && (
        <ProjectDetailPanel
          project={liveSelected}
          onClose={() => setSelectedProject(null)}
          onNewTask={handleNewTask}
        />
      )}
    </div>
  );
}
