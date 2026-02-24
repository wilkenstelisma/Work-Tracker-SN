import { type RecurrencePattern, type RecurrenceConfig } from '../types';
import { addDays, addWeeks, addMonths, addQuarters, format, parseISO } from 'date-fns';

interface RecurrenceConfigProps {
  value: RecurrenceConfig;
  onChange: (config: RecurrenceConfig) => void;
  baseDueDate?: string;
}

const patterns: RecurrencePattern[] = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Custom'];

function previewNext(baseDate: string, pattern: RecurrencePattern, interval: number): string {
  try {
    const d = parseISO(baseDate);
    let next: Date;
    switch (pattern) {
      case 'Daily': next = addDays(d, interval); break;
      case 'Weekly': next = addWeeks(d, interval); break;
      case 'Bi-weekly': next = addWeeks(d, 2); break;
      case 'Monthly': next = addMonths(d, interval); break;
      case 'Quarterly': next = addQuarters(d, interval); break;
      default: next = addDays(d, interval);
    }
    return format(next, 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export default function RecurrenceConfig({ value, onChange, baseDueDate }: RecurrenceConfigProps) {
  return (
    <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Pattern</label>
          <select
            value={value.pattern}
            onChange={e => onChange({ ...value, pattern: e.target.value as RecurrencePattern })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {patterns.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        {(value.pattern === 'Custom' || value.pattern === 'Daily') && (
          <div className="w-24">
            <label className="block text-xs font-medium text-slate-600 mb-1">Every N days</label>
            <input
              type="number"
              min={1}
              value={value.interval}
              onChange={e => onChange({ ...value, interval: parseInt(e.target.value) || 1 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
      {baseDueDate && (
        <p className="text-xs text-blue-600">
          Next occurrence: <strong>{previewNext(baseDueDate, value.pattern, value.interval)}</strong>
        </p>
      )}
      {value.cycleCount > 0 && (
        <p className="text-xs text-gray-500">Completed {value.cycleCount} cycle{value.cycleCount !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
