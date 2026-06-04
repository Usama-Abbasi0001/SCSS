import { LucideIcon } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  status: 'online' | 'offline' | 'active' | 'inactive' | 'normal' | 'emergency' | 'connected' | 'disconnected' | 'available' | 'unavailable';
  subtitle?: string;
}

export default function StatusCard({ title, value, icon: Icon, status, subtitle }: StatusCardProps) {
  const statusColors = {
    online: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    offline: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
    active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    inactive: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
    normal: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    emergency: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
    connected: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    disconnected: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
    available: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    unavailable: 'bg-slate-500/15 text-slate-300 border-slate-500/25'
  };

  const badgeDotColor = {
    online: 'bg-emerald-400',
    offline: 'bg-slate-400',
    active: 'bg-emerald-400',
    inactive: 'bg-slate-400',
    normal: 'bg-emerald-400',
    emergency: 'bg-rose-400',
    connected: 'bg-emerald-400',
    disconnected: 'bg-rose-400',
    available: 'bg-emerald-400',
    unavailable: 'bg-slate-400'
  };

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20 transition-all duration-300 hover:border-slate-700">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">{title}</p>
          <p className="text-2xl font-bold text-white break-words truncate">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-2">{subtitle}</p>}
        </div>
        <div className="flex-shrink-0 p-3 rounded-2xl bg-slate-800/50">
          <Icon className="h-6 w-6 text-slate-300" />
        </div>
      </div>
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${statusColors[status]}`}>
        <span className={`w-2 h-2 rounded-full ${badgeDotColor[status]}`} />
        {status.charAt(0).toUpperCase() + status.slice(1).replace(/([A-Z])/g, ' $1').trim()}
      </div>
    </div>
  );
}
