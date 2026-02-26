import { useState } from 'react';
import { Project, ProjectStatus, Priority, TaskLink } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ProjectFormProps {
  initial?: Partial<Project>;
  onSubmit: (data: Partial<Project>) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const PROJECT_STATUSES: ProjectStatus[] = ['Planning', 'Active', 'On Hold', 'Complete', 'Cancelled'];
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

export default function ProjectForm({ initial = {}, onSubmit, onCancel, isEdit = false }: ProjectFormProps) {
  const [name, setName] = useState(initial.name || '');
  const [description, setDescription] = useState(initial.description || '');
  const [status, setStatus] = useState<ProjectStatus>(initial.status || 'Planning');
  const [priority, setPriority] = useState<Priority>(initial.priority || 'High');
  const [targetDate, setTargetDate] = useState(initial.targetDate || '');
  const [startDate, setStartDate] = useState(initial.startDate || '');
  const [owner, setOwner] = useState(initial.owner || '');
  const [links, setLinks] = useState<TaskLink[]>(initial.links || []);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Project name is required';
    if (!targetDate) e.targetDate = 'Target date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      description: description || undefined,
      status,
      priority,
      targetDate,
      startDate: startDate || undefined,
      owner: owner.trim() || undefined,
      links,
    });
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
      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name <span className="text-red-500">*</span></label>
        <input
          className={fieldCls('name')}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Q1 Compliance Audit"
          maxLength={200}
          autoFocus
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
        <textarea
          className={fieldCls('')}
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          placeholder="What is this project about?"
        />
      </div>

      {/* Row: Status + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
          <select className={fieldCls('')} value={status} onChange={e => setStatus(e.target.value as ProjectStatus)}>
            {PROJECT_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
          <select className={fieldCls('')} value={priority} onChange={e => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Row: Start Date + Target Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
          <input type="date" className={fieldCls('')} value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date <span className="text-red-500">*</span></label>
          <input type="date" className={fieldCls('targetDate')} value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          {errors.targetDate && <p className="text-xs text-red-500 mt-1">{errors.targetDate}</p>}
        </div>
      </div>

      {/* Owner */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Lead</label>
        <input
          className={fieldCls('')}
          value={owner}
          onChange={e => setOwner(e.target.value)}
          placeholder="Responsible person's name"
        />
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
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          {isEdit ? 'Save Changes' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
