interface DashboardWidgetProps {
  label: string;
  count: number;
  color: 'red' | 'orange' | 'blue' | 'green' | 'gray';
  icon: string;
  sublabel?: string;
}

const colorMap = {
  red: 'bg-red-50 border-red-200 text-red-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  gray: 'bg-gray-50 border-gray-200 text-gray-700',
};

const countColorMap = {
  red: 'text-red-600',
  orange: 'text-orange-600',
  blue: 'text-blue-600',
  green: 'text-green-600',
  gray: 'text-gray-600',
};

export default function DashboardWidget({ label, count, color, icon, sublabel }: DashboardWidgetProps) {
  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${countColorMap[color]}`}>{count}</p>
          {sublabel && <p className="text-xs mt-1 opacity-60">{sublabel}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
