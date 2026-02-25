import { useState, useMemo, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaskStore } from '../store/taskStore';
import { Task, TaskStatus, Priority, TaskType, TaskFilters, FilterPreset } from '../types';
import TaskCard from '../components/TaskCard';
import TaskDetailPanel from '../components/TaskDetailPanel';
import { format, parseISO } from 'date-fns';
import {
  DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';

const PRESETS_KEY = 'arc-filter-presets';

const STATUSES: TaskStatus[] = ['Not Started', 'In Progress', 'Blocked', 'Under Review', 'Complete', 'Cancelled'];
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
const KANBAN_COLS: TaskStatus[] = ['Not Started', 'In Progress', 'Blocked', 'Under Review', 'Complete'];

const statusColColors: Record<TaskStatus, string> = {
  'Not Started': 'bg-gray-100 border-gray-200',
  'In Progress': 'bg-blue-50 border-blue-200',
  'Blocked': 'bg-red-50 border-red-200',
  'Under Review': 'bg-yellow-50 border-yellow-200',
  'Complete': 'bg-green-50 border-green-200',
  'Cancelled': 'bg-gray-50 border-gray-200',
};

const statusHeaderColors: Record<TaskStatus, string> = {
  'Not Started': 'text-gray-600',
  'In Progress': 'text-blue-700',
  'Blocked': 'text-red-700',
  'Under Review': 'text-yellow-700',
  'Complete': 'text-green-700',
  'Cancelled': 'text-gray-500',
};

const priorityOrder: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function defaultFilters(): TaskFilters {
  return { statuses: [], priorities: [], types: [], search: '' };
}

function loadPresets(): FilterPreset[] {
  try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]'); } catch { return []; }
}
function savePresets(p: FilterPreset[]) { localStorage.setItem(PRESETS_KEY, JSON.stringify(p)); }

// Draggable Kanban Card wrapper
function DraggableCard({ task, onClick }: { task: Task; onClick: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} className="mb-2" />
    </div>
  );
}

// Droppable column wrapper — makes empty columns valid drop targets
function DroppableColumn({ status, children, className }: { status: TaskStatus; children: ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} className={`min-h-20 transition-colors rounded-lg ${isOver ? 'bg-blue-100/60' : ''} ${className ?? ''}`}>
      {children}
    </div>
  );
}

export default function AllTasks() {
  const { tasks, updateTask } = useTaskStore();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [presets, setPresets] = useState<FilterPreset[]>(loadPresets());
  const [showFilterPresets, setShowFilterPresets] = useState(false);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status' | 'createdAt'>('dueDate');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Open task from query param
  useEffect(() => {
    const taskId = searchParams.get('task');
    if (taskId) {
      const t = tasks.find(t => t.id === taskId);
      if (t) setSelectedTask(t);
    }
  }, [searchParams, tasks]);

  const filtered = useMemo(() => {
    let result = [...tasks];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q) ||
        t.updates.some(u => u.text.toLowerCase().includes(q))
      );
    }
    if (filters.statuses.length) result = result.filter(t => filters.statuses.includes(t.status));
    if (filters.priorities.length) result = result.filter(t => filters.priorities.includes(t.priority));
    if (filters.types.length) result = result.filter(t => filters.types.includes(t.taskType));
    if (filters.dateFrom) result = result.filter(t => t.dueDate >= filters.dateFrom!);
    if (filters.dateTo) result = result.filter(t => t.dueDate <= filters.dateTo!);
    if (filters.hasSubtasks !== undefined) result = result.filter(t => filters.hasSubtasks ? t.subtasks.length > 0 : t.subtasks.length === 0);
    if (filters.isRecurring !== undefined) result = result.filter(t => t.isRecurring === filters.isRecurring);

    result.sort((a, b) => {
      if (sortBy === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority];
      if (sortBy === 'status') return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
      if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    return result;
  }, [tasks, filters, sortBy]);

  function toggleFilter<T extends string>(key: keyof TaskFilters, val: T) {
    setFilters(f => {
      const arr = (f[key] as T[]) || [];
      const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
      return { ...f, [key]: next };
    });
  }

  function savePreset() {
    const name = prompt('Preset name:');
    if (!name) return;
    const p = [...presets, { id: uuidv4(), name, filters }];
    setPresets(p);
    savePresets(p);
  }

  function applyPreset(preset: FilterPreset) {
    setFilters(preset.filters);
    setShowFilterPresets(false);
  }

  function deletePreset(id: string) {
    const p = presets.filter(x => x.id !== id);
    setPresets(p);
    savePresets(p);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Case 1: dropped directly onto a column (useDroppable id = status string)
    const destColStatus = KANBAN_COLS.find(s => s === over.id);
    if (destColStatus) {
      updateTask(active.id as string, { status: destColStatus });
      return;
    }

    // Case 2: dropped onto another task — resolve to that task's column status
    const overTask = filtered.find(t => t.id === over.id);
    if (overTask) {
      const activeTask = filtered.find(t => t.id === active.id);
      if (activeTask && overTask.status !== activeTask.status) {
        updateTask(active.id as string, { status: overTask.status });
      }
    }
  }

  const kanbanCols = KANBAN_COLS.map(status => ({
    status,
    tasks: filtered.filter(t => t.status === status),
  }));

  const hasActiveFilters = filters.search || filters.statuses.length || filters.priorities.length || filters.types.length || filters.dateFrom || filters.dateTo || filters.hasSubtasks !== undefined || filters.isRecurring !== undefined;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filter Bar */}
      <div className="p-4 bg-white border-b border-gray-200 space-y-3 flex-shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search tasks, notes, updates..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>

          {/* Sort */}
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="dueDate">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="status">Sort: Status</option>
            <option value="createdAt">Sort: Newest</option>
          </select>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button onClick={() => setView('list')} className={`px-3 py-2 text-sm transition-colors ${view === 'list' ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>☰ List</button>
            <button onClick={() => setView('kanban')} className={`px-3 py-2 text-sm transition-colors ${view === 'kanban' ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>⊞ Board</button>
          </div>

          {/* Presets */}
          <div className="relative">
            <button onClick={() => setShowFilterPresets(!showFilterPresets)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              ⚡ Presets {presets.length > 0 ? `(${presets.length})` : ''}
            </button>
            {showFilterPresets && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-56">
                {presets.length === 0 && <p className="text-xs text-gray-400 p-3">No saved presets</p>}
                {presets.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 group">
                    <button onClick={() => applyPreset(p)} className="text-sm text-slate-700 flex-1 text-left">{p.name}</button>
                    <button onClick={() => deletePreset(p.id)} className="text-gray-300 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100">✕</button>
                  </div>
                ))}
                <div className="border-t border-gray-100 p-2">
                  <button onClick={savePreset} className="w-full text-xs text-blue-600 hover:bg-blue-50 rounded px-2 py-1.5 transition-colors text-left">+ Save current filters as preset</button>
                </div>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button onClick={() => setFilters(defaultFilters())} className="text-xs text-red-500 hover:text-red-700 transition-colors">✕ Clear filters</button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => toggleFilter('statuses', s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filters.statuses.includes(s)
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
              onClick={() => toggleFilter('priorities', p)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filters.priorities.includes(p)
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {p}
            </button>
          ))}
          <span className="text-gray-300 text-xs self-center">|</span>
          <button
            onClick={() => setFilters(f => ({ ...f, isRecurring: f.isRecurring === true ? undefined : true }))}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              filters.isRecurring === true ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            ↻ Recurring
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, hasSubtasks: f.hasSubtasks === true ? undefined : true }))}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              filters.hasSubtasks === true ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            Has Subtasks
          </button>
        </div>

        <p className="text-xs text-gray-500">{filtered.length} task{filtered.length !== 1 ? 's' : ''} {hasActiveFilters ? '(filtered)' : ''}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <span className="text-4xl mb-3">📋</span>
            <p className="text-sm">No tasks match your filters.</p>
          </div>
        ) : view === 'list' ? (
          /* LIST VIEW */
          <div className="p-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(task => {
                    const done = task.subtasks.filter(s => s.status === 'Done').length;
                    const total = task.subtasks.length;
                    return (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800">{task.title}</span>
                          {task.isRecurring && <span className="ml-1 text-blue-400 text-xs">↻</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{task.taskType}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            task.status === 'Complete' ? 'bg-green-100 text-green-700' :
                            task.status === 'Blocked' ? 'bg-red-100 text-red-700' :
                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            task.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                            task.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                            task.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                          {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          {total > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.round((done/total)*100)}%` }} />
                              </div>
                              <span className="text-xs text-gray-500">{done}/{total}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* KANBAN VIEW */
          <div className="p-4 h-full">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="flex gap-4 h-full overflow-x-auto pb-4">
                {kanbanCols.map(col => (
                  <div key={col.status} className={`flex-shrink-0 w-72 rounded-xl border p-3 ${statusColColors[col.status]}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-xs font-semibold uppercase tracking-wide ${statusHeaderColors[col.status]}`}>
                        {col.status}
                      </h3>
                      <span className="text-xs bg-white/70 rounded-full px-2 py-0.5 text-gray-600 font-medium">{col.tasks.length}</span>
                    </div>
                    <SortableContext items={col.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      <DroppableColumn status={col.status}>
                        {col.tasks.map(task => (
                          <DraggableCard key={task.id} task={task} onClick={setSelectedTask} />
                        ))}
                      </DroppableColumn>
                    </SortableContext>
                  </div>
                ))}
              </div>
            </DndContext>
          </div>
        )}
      </div>

      {selectedTask && <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
