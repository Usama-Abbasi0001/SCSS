import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ParentNavbarProps {
  title?: string;
  subtitle?: string;
}

export default function ParentNavbar({ title = 'Parent Dashboard', subtitle = 'Monitor your children and campus safety status.' }: ParentNavbarProps) {
  const { user } = useAuth();

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">{subtitle}</h1>
          {user && <p className="mt-2 text-sm text-slate-400">Welcome back, {user.name}. Here’s the latest update for your children.</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-center xl:gap-4">
          <div className="flex items-center gap-2 rounded-3xl bg-slate-900/80 px-4 py-3 text-slate-300 border border-slate-800 shadow-inner">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search child, alert, or setting"
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
          </div>
          <button className="inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800">
            <Bell className="h-4 w-4 text-slate-300" />
            Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
