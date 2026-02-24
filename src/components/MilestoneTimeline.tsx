import { Milestone, MilestoneStatus } from '../types';
import { format, parseISO, isBefore } from 'date-fns';

interface MilestoneTimelineProps {
  milestones: Milestone[];
  onUpdate?: (id: string, updates: Partial<Milestone>) => void;
  onDelete?: (id: string) => void;
}

const statusConfig: Record<MilestoneStatus, { icon: string; color: string; dotColor: string }> = {
  Upcoming:   { icon: '○', color: 'text-gray-500',  dotColor: 'bg-gray-300' },
  'In Progress': { icon: '◑', color: 'text-blue-600', dotColor: 'bg-blue-400' },
  Achieved:   { icon: '●', color: 'text-green-600', dotColor: 'bg-green-500' },
  Missed:     { icon: '✕', color: 'text-red-600',   dotColor: 'bg-red-400' },
};

export default function MilestoneTimeline({ milestones, onUpdate, onDelete }: MilestoneTimelineProps) {
  if (milestones.length === 0) {
    return <p className="text-sm text-gray-400 italic">No milestones added.</p>;
  }

  const sorted = [...milestones].sort(
    (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  function autoStatus(ms: Milestone): MilestoneStatus {
    if (ms.status === 'Achieved') return 'Achieved';
    const d = parseISO(ms.targetDate);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isBefore(d, today)) return 'Missed';
    return ms.status;
  }

  return (
    <div className="relative">
      {sorted.map((ms, i) => {
        const effectiveStatus = autoStatus(ms);
        const cfg = statusConfig[effectiveStatus];
        const isLast = i === sorted.length - 1;

        return (
          <div key={ms.id} className="flex gap-3 group">
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 ${cfg.dotColor}`} />
              {!isLast && <div className="w-0.5 bg-gray-200 flex-1 my-1 min-h-[20px]" />}
            </div>
            <div className={`pb-4 flex-1 ${isLast ? '' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{ms.name}</p>
                  <p className={`text-xs mt-0.5 ${effectiveStatus === 'Missed' ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                    {effectiveStatus === 'Missed' ? '⚠ Overdue · ' : ''}
                    {format(parseISO(ms.targetDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onUpdate && (
                    <select
                      value={ms.status}
                      onChange={e => onUpdate(ms.id, { status: e.target.value as MilestoneStatus })}
                      className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white"
                      onClick={e => e.stopPropagation()}
                    >
                      <option>Upcoming</option>
                      <option>In Progress</option>
                      <option>Achieved</option>
                      <option>Missed</option>
                    </select>
                  )}
                  {onDelete && (
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(ms.id); }}
                      className="text-gray-300 hover:text-red-500 transition-colors text-sm px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
