import { useEffect, useState } from 'react';
import MapView from '../../components/map/MapView';
import { useAuth } from '../../context/AuthContext';
import {
  fetchParentProfile,
  subscribeStudentsByParent,
  StudentProfile
} from '../../services/parentService';
import { subscribeStudentLocationHistory, buildGoogleMapsUrl } from '../../services/safetyService';
import { LocationHistoryDocument } from '../../types/firestore';
import { MapPin, Clock, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function LiveTracking() {
  const { user, loading } = useAuth();
  const [child, setChild] = useState<StudentProfile | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistoryDocument[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setChild(null);
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
        setChild(null);
        setLoadingPage(false);
        return;
      }

      unsubscribeChildren = subscribeStudentsByParent(user.id, profile?.id, (updatedChildren) => {
        if (!active) return;
        if (updatedChildren.length > 0) {
          const currentChild = updatedChildren[0];
          setChild(currentChild);

          // Subscribe to location history for this child
          const studentUid = currentChild.uid || currentChild.id;
          unsubscribeHistory();
          unsubscribeHistory = subscribeStudentLocationHistory(studentUid, (history) => {
            if (active) setLocationHistory(history);
          });
        } else {
          setChild(null);
        }
        setLoadingPage(false);
      });
    };

    loadData();

    return () => {
      active = false;
      unsubscribeChildren();
      unsubscribeHistory();
    };
  }, [user?.id, loading]);

  if (loading || loadingPage) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/90 p-10">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-sky-400" />
          <p className="mt-4 text-sm text-slate-400">Connecting to live tracking stream…</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
          <MapPin className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold text-white">Live Tracking</h1>
        <p className="mt-2 text-slate-400">No linked child found to track. Please verify your student link in profile settings.</p>
      </div>
    );
  }

  const location = child.lastLocation || { lat: 24.8607, lng: 67.0011, timestamp: 'No location signal yet' };
  const googleMapsUrl = buildGoogleMapsUrl(location.lat, location.lng);
  const isEmergency = child.emergencyStatus === 'active';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-white">Live GPS Tracking</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isEmergency ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {isEmergency ? <AlertTriangle className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              {isEmergency ? 'EMERGENCY ACTIVE' : 'SAFE'}
            </span>
          </div>
          <p className="mt-1 text-slate-400">Real-time coordinates and location feed for <span className="text-white font-medium">{child.name || child.studentName}</span> ({child.registrationNumber || 'Student'})</p>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 hover:bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition shadow-lg shadow-sky-600/20"
        >
          <ExternalLink className="h-4 w-4" />
          Open in Google Maps
        </a>
      </div>

      {/* Google Map Container */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <div className="h-96 sm:h-[500px] md:h-[580px] rounded-2xl overflow-hidden border border-slate-800 relative">
          <MapView
            lat={location.lat}
            lng={location.lng}
            studentName={child.name || child.studentName || 'Student'}
          />
        </div>
      </div>

      {/* Position Details Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Latitude</p>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{location.lat ? location.lat.toFixed(6) : '0.000000'}</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Longitude</p>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{location.lng ? location.lng.toFixed(6) : '0.000000'}</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Last Timestamp</p>
            <Clock className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 text-sm font-semibold text-white">{location.timestamp || 'N/A'}</p>
        </div>
      </div>

      {/* Location History Preview */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Recent Location History</h2>
          <span className="text-xs font-mono text-slate-400">{locationHistory.length} recorded points</span>
        </div>

        {locationHistory.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">No recent location history points recorded yet.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {locationHistory.slice(0, 8).map((point, index) => (
              <div key={point.id || index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800/80 bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-300 flex-shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-mono text-white">{point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}</p>
                    <p className="text-xs text-slate-400">{point.timestamp}</p>
                  </div>
                </div>
                <a
                  href={point.googleMapsUrl || buildGoogleMapsUrl(point.latitude, point.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium self-start sm:self-auto"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Map
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
