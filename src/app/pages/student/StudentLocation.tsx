import { useEffect, useState, useRef } from 'react';
import MapView from '../../components/map/MapView';
import { useAuth } from '../../context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { StudentDocument, LocationHistoryDocument } from '../../types/firestore';
import {
  updateStudentLocation,
  subscribeStudentLocationHistory,
  buildGoogleMapsUrl
} from '../../services/safetyService';
import {
  Clock,
  ExternalLink,
  Compass,
  AlertCircle,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

export default function StudentLocation() {
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentDocument | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistoryDocument[]>([]);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // 1. Subscribe to student record
  useEffect(() => {
    if (!user?.id && !user?.uid) return;
    const studentUid = user.uid || user.id;

    const unsubStudent = onSnapshot(doc(db, 'students', studentUid), (snap) => {
      if (snap.exists()) {
        setStudent({ id: snap.id, ...snap.data() } as StudentDocument);
      }
    });

    const unsubHistory = subscribeStudentLocationHistory(studentUid, (history) => {
      setLocationHistory(history);
    });

    return () => {
      unsubStudent();
      unsubHistory();
    };
  }, [user?.id, user?.uid]);

  // 2. Request and Broadcast Current Geolocation
  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGeoLoading(false);

        if (user?.id || user?.uid) {
          const studentUid = user.uid || user.id;
          const studentName = student?.name || user.name || 'Student';
          const regNumber = student?.registrationNumber || '';

          await updateStudentLocation(studentUid, studentName, regNumber, lat, lng);
          setSyncSuccess(true);
          setTimeout(() => setSyncSuccess(false), 3000);
        }
      },
      (err) => {
        setGeoLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('Location permission denied by user. Please allow location access in your browser settings.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError('GPS position is currently unavailable. Ensure device GPS is active.');
            break;
          case err.TIMEOUT:
            setGeoError('Location request timed out. Please try again.');
            break;
          default:
            setGeoError('Failed to obtain device location.');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // 3. Start Geolocation Watcher on mount
  useEffect(() => {
    if (navigator.geolocation && (user?.id || user?.uid)) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const studentUid = user.uid || user.id;
          const studentName = student?.name || user.name || 'Student';
          const regNumber = student?.registrationNumber || '';

          await updateStudentLocation(studentUid, studentName, regNumber, lat, lng);
        },
        (err) => {
          console.warn('[StudentLocation] watchPosition warning', err.message);
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 15000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [user?.id, user?.uid, student?.name, student?.registrationNumber]);

  const location = student?.lastLocation || { lat: 24.8607, lng: 67.0011, timestamp: 'Awaiting initial GPS fix' };
  const googleMapsUrl = buildGoogleMapsUrl(location.lat, location.lng);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <div>
          <h1 className="text-3xl font-semibold text-white">Live Geolocation & Tracking</h1>
          <p className="mt-1 text-slate-400">High-accuracy GPS telemetry transmitted securely to campus security</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={requestCurrentLocation}
            disabled={geoLoading}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${geoLoading ? 'animate-spin' : ''}`} />
            {geoLoading ? 'Acquiring GPS…' : 'Sync Current GPS'}
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition"
          >
            <ExternalLink className="h-4 w-4" />
            Google Maps
          </a>
        </div>
      </div>

      {/* Geolocation Alerts & Feedback */}
      {geoError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start gap-3 text-rose-300 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{geoError}</p>
        </div>
      )}

      {syncSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p>Coordinates synchronized successfully to Firestore cloud!</p>
        </div>
      )}

      {/* Map View */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <div className="h-96 sm:h-[500px] md:h-[580px] rounded-2xl overflow-hidden border border-slate-800 relative">
          <MapView
            lat={location.lat}
            lng={location.lng}
            studentName={student?.name || 'My Location'}
          />
        </div>
      </div>

      {/* Telemetry Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Current Latitude</p>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{location.lat.toFixed(6)}</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Current Longitude</p>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{location.lng.toFixed(6)}</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Last Broadcast Time</p>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-sm font-semibold text-white">{location.timestamp || 'N/A'}</p>
        </div>
      </div>

      {/* Location History Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">My Location History</h2>
          <span className="text-xs font-mono text-slate-400">{locationHistory.length} positions recorded</span>
        </div>

        {locationHistory.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border border-slate-800/80 bg-slate-900/40">
            <Compass className="h-8 w-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No previous coordinates logged yet.</p>
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
                  <th className="py-4 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {locationHistory.slice(0, 10).map((point, index) => {
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
                          View Map
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
