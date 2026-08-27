import { useEffect, useState } from 'react';
import { AlertTriangle, MapPin, Clock, ExternalLink, CheckCircle, Search } from 'lucide-react';
import AlertBadge from '../../components/dashboard/AlertBadge';
import GoogleMapAlerts from '../../components/map/GoogleMapAlerts';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { AlertDocument } from '../../types/firestore';
import { resolveSOSAlert, buildGoogleMapsUrl } from '../../services/safetyService';

export default function LiveAlerts() {
  const [alerts, setAlerts] = useState<AlertDocument[]>([]);
  const [search, setSearch] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'alerts'), (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AlertDocument));
      items.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setAlerts(items);
    });

    return () => unsub();
  }, []);

  const handleResolve = async (alertId: string, studentId?: string) => {
    try {
      setResolvingId(alertId);
      await resolveSOSAlert(alertId, studentId, 'Campus Security Admin');
    } catch (e) {
      console.error('[LiveAlerts] resolve error', e);
    } finally {
      setResolvingId(null);
    }
  };

  const activeAlerts = alerts.filter((alert) => alert.status === 'active');
  const resolvedAlerts = alerts.filter((alert) => alert.status === 'resolved');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Live Emergency Alerts Control</h1>
        <p className="text-slate-400">Monitor and respond to campus emergency beacons and SOS alerts in real-time.</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-rose-500/20 bg-rose-950/20 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-rose-300 text-sm uppercase tracking-wider">Active Emergencies</h3>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-4xl font-bold text-rose-200">{activeAlerts.length}</p>
          <p className="text-xs text-rose-300/80 mt-1">Immediate response required</p>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-emerald-300 text-sm uppercase tracking-wider">Resolved Alerts</h3>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-4xl font-bold text-emerald-200">{resolvedAlerts.length}</p>
          <p className="text-xs text-emerald-300/80 mt-1">Successfully handled by security</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wider">Total System Alerts</h3>
            <Clock className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-4xl font-bold text-sky-300">{alerts.length}</p>
          <p className="text-xs text-slate-400 mt-1">Live Firestore event stream</p>
        </div>
      </div>

      {/* Interactive Campus Map View */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Live Emergency Dispatch Map</h2>
            <p className="text-xs text-slate-400">Visualizing active emergency markers across campus</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student by name…"
              className="rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 pl-10 pr-4 py-2.5 w-full sm:w-72 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        <GoogleMapAlerts searchTarget={search || null} />
      </div>

      {/* Active Emergencies Dispatch Cards */}
      {activeAlerts.length > 0 && (
        <div className="rounded-3xl border border-rose-500/30 bg-slate-950/95 p-6 shadow-2xl shadow-rose-950/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping" />
              <h2 className="text-xl font-bold text-white">Active Emergency Dispatches ({activeAlerts.length})</h2>
            </div>
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full">
              Live Priority 1
            </span>
          </div>

          <div className="space-y-4">
            {activeAlerts.map((alert) => {
              const lat = alert.latitude ?? alert.location?.lat;
              const lng = alert.longitude ?? alert.location?.lng;
              const mapsUrl = alert.googleMapsUrl || (lat && lng ? buildGoogleMapsUrl(lat, lng) : null);

              return (
                <div key={alert.id} className="rounded-3xl border border-rose-500/20 bg-rose-950/10 p-6 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-rose-500/20 p-3.5 rounded-2xl text-rose-300 flex-shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{alert.studentName}</h3>
                        <p className="text-slate-300 font-medium mt-1">{alert.message}</p>
                        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-rose-400" />
                          {alert.timestamp}
                        </p>
                      </div>
                    </div>

                    <AlertBadge type={alert.type}>{alert.type}</AlertBadge>
                  </div>

                  {lat && lng && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <span className="font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                      </div>

                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open Location in Google Maps
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white py-3 font-semibold text-center transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-rose-600/20"
                      >
                        <MapPin className="w-4 h-4" />
                        View Live GPS Location
                      </a>
                    )}
                    <button
                      onClick={() => handleResolve(alert.id, alert.studentId)}
                      disabled={resolvingId === alert.id}
                      className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/40 px-6 py-3 text-emerald-300 font-semibold transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {resolvingId === alert.id ? 'Resolving…' : 'Mark Emergency Resolved'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Complete Historical Feed */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-white mb-6">Recent Alerts History</h2>

        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No alerts logged in the system.</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const lat = alert.latitude ?? alert.location?.lat;
              const lng = alert.longitude ?? alert.location?.lng;
              const mapsUrl = alert.googleMapsUrl || (lat && lng ? buildGoogleMapsUrl(lat, lng) : null);

              return (
                <div
                  key={alert.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                      alert.type === 'emergency' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-base">{alert.studentName}</p>
                      <p className="text-sm text-slate-300 mt-0.5">{alert.message}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {alert.timestamp}
                        {alert.resolvedAt && (
                          <span className="text-emerald-400 ml-2">
                            • Resolved at {alert.resolvedAt} ({alert.resolvedBy || 'Admin'})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                    <AlertBadge type={alert.type}>{alert.type}</AlertBadge>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        alert.status === 'active'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {alert.status}
                    </span>

                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-sky-400 hover:text-sky-300"
                        title="Open in Google Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
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
