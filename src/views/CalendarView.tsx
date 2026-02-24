import { useState, useMemo } from 'react';
import { useTaskStore } from '../store/taskStore';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameMonth, isToday, isSameDay, parseISO, addMonths, subMonths,
} from 'date-fns';
import { Task } from '../types';
import TaskDetailPanel from '../components/TaskDetailPanel';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView() {
  const { tasks } = useTaskStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  function tasksForDay(day: Date) {
    return tasks.filter(t => {
      if (isSameDay(parseISO(t.dueDate), day)) return true;
      for (const ms of t.milestones) {
        if (isSameDay(parseISO(ms.targetDate), day)) return true;
      }
      return false;
    });
  }

  const selectedDayTasks = selectedDay ? tasksForDay(selectedDay) : [];

  return (
    <div className="flex h-full">
      {/* Calendar */}
      <div className="flex-1 p-6 flex flex-col overflow-hidden">
        {/* Month Nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">←</button>
          <h2 className="text-lg font-semibold text-slate-800">{format(currentMonth, 'MMMM yyyy')}</h2>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">→</button>
        </div>

        {/* Day of Week headers */}
        <div className="grid grid-cols-7 mb-2">
          {DOW.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
            {days.map(day => {
              const dayTasks = tasksForDay(day);
              const inMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const todayStyle = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`bg-white min-h-20 p-1.5 cursor-pointer transition-colors hover:bg-blue-50 ${
                    !inMonth ? 'opacity-40' : ''
                  } ${isSelected ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                >
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1 font-medium ${
                    todayStyle ? 'bg-blue-600 text-white' : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map(t => (
                      <div
                        key={t.id}
                        onClick={e => { e.stopPropagation(); setSelectedTask(t); }}
                        className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${
                          t.status === 'Complete' ? 'bg-green-100 text-green-700' :
                          t.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                          t.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}
                        title={t.title}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-gray-400 px-1">+{dayTasks.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Detail Sidebar */}
      {selectedDay && (
        <div className="w-72 border-l border-gray-200 bg-white p-4 overflow-y-auto flex-shrink-0">
          <h3 className="font-semibold text-slate-800 mb-3">
            {format(selectedDay, 'MMMM d, yyyy')}
          </h3>
          {selectedDayTasks.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No tasks on this date.</p>
          ) : (
            <div className="space-y-2">
              {selectedDayTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <p className="text-sm font-medium text-slate-800 leading-tight">{t.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.status} · {t.priority}</p>
                  {/* Check if it's a milestone task */}
                  {t.milestones.some(ms => isSameDay(parseISO(ms.targetDate), selectedDay)) && (
                    <p className="text-xs text-blue-600 mt-0.5">
                      📍 {t.milestones.filter(ms => isSameDay(parseISO(ms.targetDate), selectedDay)).map(ms => ms.name).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTask && <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
