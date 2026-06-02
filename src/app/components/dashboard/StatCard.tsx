import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color: 'blue' | 'purple' | 'green' | 'red';
}

const colorClasses = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  red: 'bg-red-500'
};

export default function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400 mb-3">{title}</p>
          <p className="text-4xl font-semibold text-white">{value}</p>
          {trend && (
            <p className={`mt-3 text-sm font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-3xl ${colorClasses[color]}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}
