import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchParentProfile,
  subscribeStudentsByParent,
  StudentProfile
} from '../../services/parentService';
import { resolveSOSAlert, buildGoogleMapsUrl } from '../../services/safetyService';
import { AlertDocument } from '../../types/firestore';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import {
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Clock,
  ExternalLink,
  CheckCircle,
  Shield,
  Activity
} from 'lucide-react';

export default function ParentAlerts() {
  const { user, loading } = useAuth();
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [childAlerts, setChildAlerts] = useState<AlertDocument[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setChildren([]);
      setChildAlerts([]);
      setLoadingPage(false);
      return;
    }

    let active = true;
    let unsubscribeChildren = () => {};
    let unsubscribeAlerts = () => {};
    setLoadingPage(true);

    const loadData = async () => {
      const profile = await fetchParentProfile(user.id);
      if (!active) return;

      if (!profile) {
        setChildren([]);
        setLoadingPage(false);
        return;
      }

      unsubscribeChildren = subscribeStudentsByParent(user.id, profile?.id, (updatedChildren) => {
        if (!active) return;
        setChildren(updatedChildren);
        setLoadingPage(false);

        if (updatedChildren.length > 0) {
          const childId = updatedChildren[0].uid || updatedChildren[0].id;
          unsubscribeAlerts();
          const q = query(collection(db, 'alerts'), where('studentId', '==', childId));
          unsubscribeAlerts = onSnapshot(q, (snapshot) => {
            if (active) {
              const alerts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AlertDocument);
              alerts.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
              setChildAlerts(alerts);
            }
          });
        }
      });
    };

    loadData();

    return () => {
      active = false;
      unsubscribeChildren();
      unsubscribeAlerts();
    };
  }, [user?.id, loading]);

  const handleResolve = async (alertId: string, studentId?: string) => {
    try {
      setResolvingId(alertId);
      await resolveSOSAlert(alertId, studentId, user?.name || 'Parent');
    } catch (e) {
      console.error('[ParentAlerts] resolve error', e);
    } finally {
      setResolvingId(null);
    }
  };

  if (loading || loadingPage) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/90 p-10">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-rose-500" />
          <p className="mt-4 text-sm text-slate-400">Loading alerts stream…</p>
        </div>
      </div>
    );
  }

  const child = children[0];
  const activeAlerts = childAlerts.filter((a) => a.status === 'active');
  const resolvedAlerts = childAlerts.filter((a) => a.status === 'resolved');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <h1 className="text-3xl font-semibold text-white">Safety & SOS Alerts</h1>
        <p className="mt-1 text-slate-400">
          Emergency notifications and SOS event logs for{' '}
          <span className="text-white font-medium">{child?.name || child?.studentName || 'your child'}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-rose-500/20 bg-rose-950/20 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-rose-300 font-medium">Active Alerts</p>
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-rose-200">{activeAlerts.length}</p>
          <p className="mt-1 text-xs text-rose-300/80">Requires immediate attention</p>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-emerald-300 font-medium">Resolved Alerts</p>
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-emerald-200">{resolvedAlerts.length}</p>
          <p className="mt-1 text-xs text-emerald-300/80">Safely handled and closed</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total Alerts</p>
            <Activity className="h-5 w-5 text-sky-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{childAlerts.length}</p>
          <p className="mt-1 text-xs text-slate-400">Total logged records</p>
        </div>
      </div>

      {/* Active Emergencies Section */}
      {activeAlerts.length > 0 && (
        <div className="rounded-3xl border border-rose-500/30 bg-slate-950/95 p-6 shadow-2xl shadow-rose-950/20">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
            <h2 className="text-xl font-bold text-white">Active Emergencies in Progress</h2>
          </div>

          <div className="space-y-4">
            {activeAlerts.map((alert) => {
              const lat = alert.latitude ?? alert.location?.lat;
              const lng = alert.longitude ?? alert.location?.lng;
              const mapsUrl = alert.googleMapsUrl || (lat && lng ? buildGoogleMapsUrl(lat, lng) : null);

              return (
                <div
                  key={alert.id}
                  className="rounded-3xl border border-rose-500/20 bg-rose-950/10 p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-300 flex-shrink-0">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{alert.message}</h3>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-rose-400" />
                          {alert.timestamp}
                        </p>
                      </div>
                    </div>

                    <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 self-start">
                      Active SOS
                    </span>
                  </div>

                  {lat && lng && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <MapPin className="h-4 w-4 text-rose-400 flex-shrink-0" />
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

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleResolve(alert.id, alert.studentId)}
                      disabled={resolvingId === alert.id}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {resolvingId === alert.id ? 'Marking Resolved…' : 'Mark as Resolved'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Alerts History List */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <h2 className="text-xl font-semibold text-white mb-6">Complete Alert History</h2>

        {childAlerts.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-slate-800/60 bg-slate-900/30">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
              <Shield className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-white">No Alert History</h3>
            <p className="text-xs text-slate-400 mt-1">Your child has not triggered any safety alerts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {childAlerts.map((alert) => {
              const lat = alert.latitude ?? alert.location?.lat;
              const lng = alert.longitude ?? alert.location?.lng;
              const mapsUrl = alert.googleMapsUrl || (lat && lng ? buildGoogleMapsUrl(lat, lng) : null);

              return (
                <div
                  key={alert.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                      alert.type === 'emergency' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{alert.message}</h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {alert.timestamp}
                        {alert.resolvedAt && <span className="text-emerald-400 ml-2">• Resolved at {alert.resolvedAt}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      alert.status === 'active'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
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
                        <ExternalLink className="h-4 w-4" />
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
