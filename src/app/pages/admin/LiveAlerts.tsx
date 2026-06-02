import { useEffect, useState } from 'react';
import { AlertTriangle, MapPin, Clock } from 'lucide-react';
import AlertBadge from '../../components/dashboard/AlertBadge';
import GoogleMapAlerts from '../../components/map/GoogleMapAlerts';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { AlertDocument } from '../../types/firestore';

export default function LiveAlerts() {
  const [alerts, setAlerts] = useState<AlertDocument[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'alerts'), (snapshot) => {
      setAlerts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AlertDocument)));
    });

    return () => unsub();
  }, []);

  const activeAlerts = alerts.filter((alert) => alert.status === 'active');
  const resolvedAlerts = alerts.filter((alert) => alert.status === 'resolved');
  const recentAlerts = [...alerts].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Live Emergency Alerts</h1>
        <p className="text-slate-400 mt-2">Monitor and respond to campus emergencies in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white">Active Alerts</h3>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-3xl font-bold text-rose-300">{activeAlerts.length}</p>
          <p className="text-sm text-slate-400 mt-1">Requires immediate attention</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white">Resolved Alerts</h3>
            <Clock className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-emerald-300">{resolvedAlerts.length}</p>
          <p className="text-sm text-slate-400 mt-1">Successfully handled</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white">Total Alerts</h3>
            <Clock className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-3xl font-bold text-sky-300">{alerts.length}</p>
          <p className="text-sm text-slate-400 mt-1">From Firebase</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student by name" className="rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 px-3 py-2 w-72" />
        </div>
        <GoogleMapAlerts searchTarget={search || null} />
      </div>

      <div className="space-y-6">
        {activeAlerts.length > 0 && (
          <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Active Emergencies</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
                <span className="text-sm text-rose-300 font-medium">Live Updates</span>
              </div>
            </div>
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="rounded-3xl border border-rose-500/10 bg-slate-900/80 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-rose-500/15 p-3 rounded-2xl">
                        <AlertTriangle className="w-6 h-6 text-rose-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{alert.studentName}</h3>
                        <p className="text-slate-300 font-medium mt-1">{alert.message}</p>
                      </div>
                    </div>
                    <AlertBadge type={alert.type}>{alert.type}</AlertBadge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <MapPin className="w-4 h-4 text-rose-400" />
                      <span>
                        {alert.location?.lat != null && alert.location?.lng != null
                          ? `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}`
                          : 'Location unavailable'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Clock className="w-4 h-4 text-rose-400" />
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-4 lg:flex-row">
                    <button className="flex-1 rounded-2xl bg-rose-600 text-white py-3 font-medium hover:bg-rose-500 transition-colors">
                      View Location
                    </button>
                    <button className="rounded-2xl border border-rose-500/20 bg-slate-950/90 px-6 py-3 text-rose-300 font-medium hover:bg-slate-900 transition-colors">
                      Mark Resolved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/30">
          <h2 className="text-xl font-semibold text-white mb-6">Recent Alerts History</h2>
          <div className="space-y-3">
            {recentAlerts.length === 0 ? (
              <p className="text-sm text-slate-500">No alerts available from Firebase.</p>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="flex flex-col gap-4 p-4 rounded-3xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{alert.studentName}</p>
                      <p className="text-sm text-slate-300">{alert.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{alert.timestamp}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <AlertBadge type={alert.type}>{alert.type}</AlertBadge>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        alert.status === 'active'
                          ? 'bg-rose-500/10 text-rose-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
