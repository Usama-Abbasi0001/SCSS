import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { AlertDocument } from '../../types/firestore';
import { buildGoogleMapsUrl } from '../../services/safetyService';
import {
  AlertTriangle,
  Bell,
  Clock,
  ExternalLink,
  ShieldCheck,
  Activity
} from 'lucide-react';

export default function StudentAlerts() {
  const { user, loading } = useAuth();
  const [studentAlerts, setStudentAlerts] = useState<AlertDocument[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  useEffect(() => {
    if (!user?.id && !user?.uid) {
      setStudentAlerts([]);
      setLoadingAlerts(false);
      return;
    }

    const studentUid = user.uid || user.id;
    setLoadingAlerts(true);

    const alertsQuery = query(collection(db, 'alerts'), where('studentId', '==', studentUid));
    const unsubscribe = onSnapshot(
      alertsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as AlertDocument[];

        items.sort(
          (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
        );
        setStudentAlerts(items);
        setLoadingAlerts(false);
      },
      (err) => {
        console.error('[StudentAlerts] alerts query error', err);
        setLoadingAlerts(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id, user?.uid]);

  if (loading || loadingAlerts) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/90 p-10">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
          <p className="mt-4 text-sm text-slate-400">Loading your alert history…</p>
        </div>
      </div>
    );
  }

  const activeCount = studentAlerts.filter((a) => a.status === 'active').length;
  const resolvedCount = studentAlerts.filter((a) => a.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <h1 className="text-3xl font-semibold text-white">Alert History & Logs</h1>
        <p className="mt-1 text-slate-400">View all your emergency alarms, warnings, and security resolutions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-rose-500/20 bg-rose-950/20 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-rose-300 font-medium">Active Alerts</p>
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-rose-200">{activeCount}</p>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-emerald-300 font-medium">Resolved Alerts</p>
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-emerald-200">{resolvedCount}</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total Logged Events</p>
            <Activity className="h-5 w-5 text-sky-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{studentAlerts.length}</p>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <h2 className="text-xl font-semibold text-white mb-6">Historical Log</h2>

        {studentAlerts.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-slate-800/80 bg-slate-900/30">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-slate-500">
              <Bell className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-white">No Past Alerts</h3>
            <p className="text-xs text-slate-400 mt-1">You have not triggered any SOS alarms. Stay safe!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {studentAlerts.map((alert) => {
              const lat = alert.latitude ?? alert.location?.lat;
              const lng = alert.longitude ?? alert.location?.lng;
              const mapsUrl = alert.googleMapsUrl || (lat && lng ? buildGoogleMapsUrl(lat, lng) : null);

              return (
                <div
                  key={alert.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    alert.status === 'active'
                      ? 'border-rose-500/30 bg-rose-950/10'
                      : 'border-slate-800/80 bg-slate-900/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                        alert.type === 'emergency' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-base">{alert.message}</h4>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          {alert.timestamp}
                          {alert.resolvedAt && (
                            <span className="text-emerald-400 ml-2 font-medium">
                              • Resolved at {alert.resolvedAt} ({alert.resolvedBy || 'Security'})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        alert.status === 'active'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {alert.status}
                      </span>

                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-semibold p-2"
                          title="Open in Google Maps"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
