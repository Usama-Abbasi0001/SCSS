import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchParentProfile,
  subscribeStudentsByParent,
  StudentProfile
} from '../../services/parentService';
import { subscribeStudentLocationHistory, buildGoogleMapsUrl } from '../../services/safetyService';
import { LocationHistoryDocument } from '../../types/firestore';
import {
  Clock,
  ExternalLink,
  Navigation,
  Activity,
  Compass
} from 'lucide-react';

export default function ParentLocationUpdates() {
  const { user, loading } = useAuth();
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [locationHistory, setLocationHistory] = useState<LocationHistoryDocument[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setChildren([]);
      setLoadingPage(false);
      return;
    }

    let active = true;
    let unsubscribeChildren = () => {};
    let unsubscribeHistory = () => {};
    setLoadingPage(true);

    const loadData = async () => {
      const profile = await fetchParentProfile(user.id);
      if (!active) return;

      if (!profile) {
        setChildren([]);
        setLoadingPage(false);
        return;
      }

      unsubscribeChildren = subscribeStudentsByParent(
        user.id,
        profile?.id,
        (updatedChildren) => {
          if (!active) return;
          setChildren(updatedChildren);
          setLoadingPage(false);

          if (updatedChildren.length > 0) {
            const currentChild = updatedChildren[0];
            const studentUid = currentChild.uid || currentChild.id;

            unsubscribeHistory();
            unsubscribeHistory = subscribeStudentLocationHistory(studentUid, (history) => {
              if (active) setLocationHistory(history);
            });
          }
        },
        profile
      );
    };

    const fallbackTimer = setTimeout(() => {
      if (active) setLoadingPage(false);
    }, 1500);

    loadData();

    return () => {
      active = false;
      clearTimeout(fallbackTimer);
      unsubscribeChildren();
      unsubscribeHistory();
    };
  }, [user?.id, loading]);

  if (loading || loadingPage) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/90 p-10">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
          <p className="mt-4 text-sm text-slate-400">Loading location history updates…</p>
        </div>
      </div>
    );
  }

  const child = children[0];
  const latestPoint = locationHistory[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <h1 className="text-3xl font-semibold text-white">Location Updates & History</h1>
        <p className="mt-1 text-slate-400">
          Chronological GPS breadcrumbs and position updates for{' '}
          <span className="text-white font-medium">{child?.name || child?.studentName || 'your child'}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total Updates</p>
            <Activity className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{locationHistory.length}</p>
          <p className="mt-1 text-xs text-slate-400">Logged coordinate points</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Latest Coordinates</p>
            <Navigation className="h-5 w-5 text-sky-400" />
          </div>
          <p className="mt-3 text-lg font-mono font-bold text-white truncate">
            {latestPoint ? `${latestPoint.latitude.toFixed(4)}, ${latestPoint.longitude.toFixed(4)}` : 'Awaiting GPS'}
          </p>
          <p className="mt-1 text-xs text-slate-400">Most recent recorded fix</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Last Broadcast</p>
            <Clock className="h-5 w-5 text-fuchsia-400" />
          </div>
          <p className="mt-3 text-sm font-semibold text-white truncate">
            {latestPoint?.timestamp || 'N/A'}
          </p>
          <p className="mt-1 text-xs text-slate-400">Automatic interval telemetry</p>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <h2 className="text-xl font-semibold text-white mb-6">Location Log</h2>

        {locationHistory.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-slate-800/80 bg-slate-900/30">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-slate-500">
              <Compass className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-white">No Location Updates Yet</h3>
            <p className="text-xs text-slate-400 mt-1">Location points will appear here automatically as your child moves.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-4">#</th>
                  <th className="py-4 px-4">Latitude</th>
                  <th className="py-4 px-4">Longitude</th>
                  <th className="py-4 px-4">Timestamp</th>
                  <th className="py-4 px-4 text-right">Map View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {locationHistory.map((point, index) => {
                  const mapsUrl = point.googleMapsUrl || buildGoogleMapsUrl(point.latitude, point.longitude);

                  return (
                    <tr key={point.id || index} className="hover:bg-slate-900/50 transition">
                      <td className="py-4 px-4 font-mono text-slate-500">{index + 1}</td>
                      <td className="py-4 px-4 font-mono text-slate-200">{point.latitude.toFixed(6)}</td>
                      <td className="py-4 px-4 font-mono text-slate-200">{point.longitude.toFixed(6)}</td>
                      <td className="py-4 px-4 text-slate-300 flex items-center gap-2 mt-1">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        {point.timestamp}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600/10 hover:bg-sky-600/20 text-sky-400 text-xs font-semibold transition"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View on Map
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
