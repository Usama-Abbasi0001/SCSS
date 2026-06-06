import { useEffect, useState } from 'react';
import MapView from '../../components/map/MapView';
import { useAuth } from '../../context/AuthContext';
import {
  fetchParentProfile,
  subscribeStudentsByParent,
  ParentProfile,
  StudentProfile
} from '../../services/parentService';

export default function LiveTracking() {
  const { user, loading } = useAuth();
  const [child, setChild] = useState<StudentProfile | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setChild(null);
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
        setChild(null);
        setLoadingPage(false);
        return;
      }

      unsubscribeChildren = subscribeStudentsByParent(user.id, profile?.id, (updatedChildren) => {
        if (!active) return;
        if (updatedChildren.length > 0) {
          setChild(updatedChildren[0]);
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
    };
  }, [user?.id, loading]);

  if (loading || loadingPage) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/90 p-10">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-slate-400" />
          <p className="mt-4 text-sm text-slate-400">Loading tracking...</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8">
        <h1 className="text-2xl font-semibold text-white">Live Tracking</h1>
        <p className="mt-4 text-slate-400">No linked child found to track.</p>
      </div>
    );
  }

  const location = child.lastLocation || { latitude: 0, longitude: 0 };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <h1 className="text-3xl font-semibold text-white">Live Tracking</h1>
        <p className="mt-2 text-slate-400">Real-time location of {child.studentName}</p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10 overflow-hidden">
        <div className="h-96 sm:h-[500px] md:h-[600px] rounded-2xl overflow-hidden border border-slate-800">
          <MapView
            lat={location.lat || 0}
            lng={location.lng || 0}
            studentName={child.studentName || 'Student'}
          />
        </div>
      </div>

      {/* Location Details */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Location Details</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {location.lat && (
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-xs text-slate-400">Latitude</p>
              <p className="mt-2 font-mono font-semibold text-white">{location.lat.toFixed(6)}</p>
            </div>
          )}

          {location.lng && (
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-xs text-slate-400">Longitude</p>
              <p className="mt-2 font-mono font-semibold text-white">{location.lng.toFixed(6)}</p>
            </div>
          )}

          {location.timestamp && (
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-xs text-slate-400">Last Updated</p>
              <p className="mt-2 font-semibold text-white">{location.timestamp}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
