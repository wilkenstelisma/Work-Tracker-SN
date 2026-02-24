import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const items: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
  { to: '/tasks', label: 'All Tasks', icon: '☰' },
  { to: '/calendar', label: 'Calendar', icon: '📅' },
  { to: '/recurring', label: 'Recurring', icon: '↻' },
  { to: '/alerts', label: 'Alerts', icon: '🔔' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-slate-900 flex flex-col flex-shrink-0">
      <div className="h-16 flex items-center px-4 border-b border-slate-700">
        <span className="text-white font-bold text-sm tracking-wide">ARC Task Tracker</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <p className="text-slate-500 text-xs">v1.0 · Wilkens ARC</p>
      </div>
    </aside>
  );
}
