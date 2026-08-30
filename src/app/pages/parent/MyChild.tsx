import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchParentProfile,
  subscribeStudentsByParent,
  StudentProfile
} from '../../services/parentService';
import { buildGoogleMapsUrl } from '../../services/safetyService';
import { MapPin, User, Phone, ShieldCheck, AlertTriangle, Battery, ExternalLink, Hash, BookOpen } from 'lucide-react';

export default function MyChild() {
  const { user, loading } = useAuth();
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setChildren([]);
      setLoadingPage(false);
      return;
    }

    let active = true;
    let unsubscribeChildren = () => {};
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
    };
  }, [user?.id, loading]);

  if (loading || loadingPage) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/90 p-10">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-fuchsia-500" />
          <p className="mt-4 text-sm text-slate-400">Loading student profile…</p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
          <User className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold text-white">My Child Profile</h1>
        <p className="mt-2 text-slate-400">No linked student found for your parent account. Please contact campus admin to link your child.</p>
      </div>
    );
  }

  const child = children[0];
  const isEmergency = child.emergencyStatus === 'active';
  const location = child.lastLocation || { lat: 24.8607, lng: 67.0011, timestamp: 'No GPS data yet' };
  const googleMapsUrl = buildGoogleMapsUrl(location.lat, location.lng);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <div>
          <h1 className="text-3xl font-semibold text-white">Student Profile</h1>
          <p className="mt-1 text-slate-400">Complete records and real-time safety status for your child</p>
        </div>

        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold self-start sm:self-auto ${
          isEmergency
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
        }`}>
          {isEmergency ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          {isEmergency ? 'ACTIVE EMERGENCY' : 'STATUS: SAFE'}
        </span>
      </div>

      {/* Main Profile Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/95 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 h-32" />
        <div className="px-6 pb-8 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-16 mb-6">
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-slate-900 rounded-3xl shadow-2xl flex items-center justify-center border-4 border-slate-950 text-fuchsia-400 font-bold text-3xl sm:text-4xl flex-shrink-0">
              {(child.name || child.studentName || 'Student').split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="pb-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">{child.name || child.studentName}</h2>
              <p className="text-slate-400 flex items-center gap-2 mt-1">
                <Hash className="h-4 w-4 text-fuchsia-400" />
                Registration: <span className="text-slate-200 font-mono">{child.registrationNumber || 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-fuchsia-500/10 text-fuchsia-300">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Phone Number</p>
                <p className="mt-1 font-semibold text-white">{child.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-300">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Address</p>
                <p className="mt-1 font-semibold text-white">{child.address || 'Campus Residence'}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-300">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Class / Grade</p>
                <p className="mt-1 font-semibold text-white">{child.grade || child.class || 'Campus Regular'}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-300">
                <Battery className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Assigned IoT Device</p>
                <p className="mt-1 font-mono font-semibold text-white">{child.deviceId || 'ESP32-TRACKER'}</p>
              </div>
            </div>
          </div>

          {/* Last Known Position */}
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-sky-400" />
                <h3 className="font-semibold text-white">Last Known GPS Location</h3>
              </div>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold"
              >
                <ExternalLink className="h-4 w-4" />
                Open in Google Maps
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 text-xs block">Latitude</span>
                <span className="font-mono text-white font-medium">{location.lat.toFixed(6)}</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 text-xs block">Longitude</span>
                <span className="font-mono text-white font-medium">{location.lng.toFixed(6)}</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 text-xs block">Last Updated</span>
                <span className="text-slate-200 text-xs truncate block">{location.timestamp}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
