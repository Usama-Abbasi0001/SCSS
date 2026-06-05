import { useState } from 'react';
import { Bell, Globe, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ParentSettings() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [dailyReport, setDailyReport] = useState(false);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Parent settings</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Customize your safety preferences</h2>
          </div>
          <button className="inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800">
            <User className="h-4 w-4 text-slate-300" />
            {user?.name || 'Your profile'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm shadow-slate-950/10">
          <div className="flex items-center gap-3 text-slate-400">
            <Bell className="h-5 w-5" />
            <p className="text-sm font-medium">Notification controls</p>
          </div>
          <div className="mt-6 space-y-4">
            <label className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-4">
              <div>
                <p className="font-semibold text-white">Push alerts</p>
                <p className="text-sm text-slate-500">Instant safety notifications for your child.</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications((value) => !value)}
                className={`h-10 w-20 rounded-full transition ${notifications ? 'bg-emerald-500/90' : 'bg-slate-700/70'}`}
              >
                <span className={`block h-9 w-9 rounded-full bg-white shadow ${notifications ? 'translate-x-11' : 'translate-x-1'} transition-transform`} />
              </button>
            </label>

            <label className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-4">
              <div>
                <p className="font-semibold text-white">Location sharing</p>
                <p className="text-sm text-slate-500">Allow device locations to update in real time.</p>
              </div>
              <button
                type="button"
                onClick={() => setLocationSharing((value) => !value)}
                className={`h-10 w-20 rounded-full transition ${locationSharing ? 'bg-sky-500/90' : 'bg-slate-700/70'}`}
              >
                <span className={`block h-9 w-9 rounded-full bg-white shadow ${locationSharing ? 'translate-x-11' : 'translate-x-1'} transition-transform`} />
              </button>
            </label>

            <label className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-4">
              <div>
                <p className="font-semibold text-white">Daily summary</p>
                <p className="text-sm text-slate-500">Receive a morning summary of all activities.</p>
              </div>
              <button
                type="button"
                onClick={() => setDailyReport((value) => !value)}
                className={`h-10 w-20 rounded-full transition ${dailyReport ? 'bg-violet-500/90' : 'bg-slate-700/70'}`}
              >
                <span className={`block h-9 w-9 rounded-full bg-white shadow ${dailyReport ? 'translate-x-11' : 'translate-x-1'} transition-transform`} />
              </button>
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm shadow-slate-950/10">
          <div className="flex items-center gap-3 text-slate-400">
            <Globe className="h-5 w-5" />
            <p className="text-sm font-medium">Security settings</p>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Email Alerts</p>
              <p className="mt-2 text-lg font-semibold text-white">Enabled</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Two-factor authentication</p>
              <p className="mt-2 text-lg font-semibold text-white">Recommended</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Emergency contact</p>
              <p className="mt-2 text-lg font-semibold text-white">+92 300 1234567</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
