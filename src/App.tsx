import { useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import Dashboard from './views/Dashboard';
import AllTasks from './views/AllTasks';
import Projects from './views/Projects';
import CalendarView from './views/CalendarView';
import RecurringTasks from './views/RecurringTasks';
import AlertsNotifications from './views/AlertsNotifications';
import Settings from './views/Settings';
import TaskForm from './components/TaskForm';
import { useTaskStore } from './store/taskStore';
import { useNotificationStore } from './store/notificationStore';
import { computeAlerts } from './utils/alertEngine';
import { checkAndGenerateRecurring } from './utils/recurrence';
import toast from 'react-hot-toast';
import { Task } from './types';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/tasks': 'All Tasks',
  '/projects': 'Projects',
  '/calendar': 'Calendar',
  '/recurring': 'Recurring Tasks',
  '/alerts': 'Alerts & Notifications',
  '/settings': 'Settings',
};

function PageTitle({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'ARC Task Tracker';
  return <>{children}</>;
}

function AppShell() {
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskProjectId, setNewTaskProjectId] = useState<string | undefined>();
  const { tasks, createTask } = useTaskStore();
  const { setAlerts } = useNotificationStore();
  const location = useLocation();
  const alertInterval = useRef<ReturnType<typeof setInterval>>();

  function runAlertEngine() {
    const alerts = computeAlerts(tasks);
    setAlerts(alerts);
  }

  function runRecurrenceCheck() {
    const { updateTask } = useTaskStore.getState();
    checkAndGenerateRecurring(tasks, updateTask);
  }

  useEffect(() => {
    runAlertEngine();
    runRecurrenceCheck();
    alertInterval.current = setInterval(runAlertEngine, 15 * 60 * 1000);
    return () => clearInterval(alertInterval.current);
  }, [tasks]);

  function handleCreateTask(data: Partial<Task>) {
    if (!data.title || !data.dueDate || !data.priority || !data.taskType) return;
    createTask({
      title: data.title,
      taskType: data.taskType,
      status: data.status || 'Not Started',
      priority: data.priority,
      dueDate: data.dueDate,
      description: data.description,
      startDate: data.startDate,
      assignee: data.assignee,
      notes: data.notes,
      isRecurring: data.isRecurring,
      recurrence: data.recurrence,
      reminderDays: data.reminderDays,
      subtasks: data.subtasks?.map(s => ({ title: s.title, status: s.status })),
      milestones: data.milestones?.map(m => ({ name: m.name, targetDate: m.targetDate, status: m.status })),
      links: data.links?.map(l => ({ label: l.label, url: l.url })),
      projectId: data.projectId,
    });
    setShowNewTask(false);
    setNewTaskProjectId(undefined);
    toast.success('Task created!');
  }

  const pageTitle = pageTitles[location.pathname] || 'ARC Task Tracker';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav onNewTask={() => { setNewTaskProjectId(undefined); setShowNewTask(true); }} pageTitle={pageTitle} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<AllTasks />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/recurring" element={<RecurringTasks />} />
            <Route path="/alerts" element={<AlertsNotifications />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>

      {/* New Task Modal */}
      {showNewTask && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-lg">New Task</h3>
                <button onClick={() => setShowNewTask(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
            </div>
            <div className="p-6">
              <TaskForm
                onSubmit={handleCreateTask}
                onCancel={() => setShowNewTask(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: '14px', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' },
        }}
      />
    </HashRouter>
  );
}
