import { parentAnalyticsSummary, parentSafetyTrends } from './parentDashboardData';
import { BarChart3, Clock } from 'lucide-react';

const statusColorMap: Record<string, string> = {
  green: 'text-emerald-300 bg-emerald-500/10',
  blue: 'text-sky-300 bg-sky-500/10',
  amber: 'text-amber-300 bg-amber-500/10',
  red: 'text-rose-300 bg-rose-500/10'
};

const iconBackgroundMap: Record<string, string> = {
  green: 'bg-emerald-500/10 text-emerald-300',
  blue: 'bg-sky-500/10 text-sky-300',
  amber: 'bg-amber-500/10 text-amber-300',
  red: 'bg-rose-500/10 text-rose-300'
};

export default function ParentAnalytics() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        {parentAnalyticsSummary.map((item) => (
          <div key={item.title} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm shadow-slate-950/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{item.title}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
              </div>
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl ${iconBackgroundMap[item.color]}`}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
            <p className={`mt-4 text-sm ${statusColorMap[item.color].split(' ')[0]}`}>Trend: {item.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm shadow-slate-950/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Safety Trends</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Weekly campus safety metrics</h2>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-800 text-sky-300">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {parentSafetyTrends.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                <div>
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{item.value}%</p>
                </div>
                <div className="h-3 w-32 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-3 rounded-full bg-sky-500" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm shadow-slate-950/10">
          <div className="flex items-center gap-3 text-slate-400">
            <Clock className="h-5 w-5" />
            <p className="text-sm">Last update 2 minutes ago</p>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Highest activity zone</p>
              <p className="mt-2 text-xl font-semibold text-white">Library and Science Block</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Active alert count</p>
              <p className="mt-2 text-xl font-semibold text-white">1 alert</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
