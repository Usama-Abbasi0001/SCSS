import { useEffect, useState } from 'react';
import { MapPin, Phone, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchParentProfile,
  subscribeStudentsByParent,
  ParentProfile,
  StudentProfile
} from '../../services/parentService';

export default function ParentDashboard() {
  const { user, loading } = useAuth();
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setParentProfile(null);
      setChildren([]);
      setLoadingDashboard(false);
      return;
    }

    let active = true;
    let unsubscribeChildren = () => {};
    setLoadingDashboard(true);

    const loadDashboard = async () => {
      const profile = await fetchParentProfile(user.id);
      if (!active) return;

      setParentProfile(profile);
      if (!profile) {
        setChildren([]);
        setLoadingDashboard(false);
        return;
      }

      unsubscribeChildren = subscribeStudentsByParent(user.id, profile?.id, (updatedChildren) => {
        if (!active) return;
        setChildren(updatedChildren);
        setLoadingDashboard(false);
      });
    };

    loadDashboard();

    return () => {
      active = false;
      unsubscribeChildren();
    };
  }, [user?.id, loading]);

  if (loading || loadingDashboard) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/90 p-10">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-slate-400" />
          <p className="mt-4 text-sm text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const parentName = parentProfile?.parentName || user?.name || 'Parent';
  const contactNumber = parentProfile?.contactNumber || 'Not provided';
  const area = parentProfile?.area || 'Not provided';
  const linkedChild = children[0];

  return (
    <div className="space-y-6">
      {/* Parent Information */}
      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Parent Information</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{parentName}</h1>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 text-sky-300">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Contact Number</p>
                  <p className="mt-1 font-semibold text-white">{contactNumber}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Area / Location</p>
                  <p className="mt-1 font-semibold text-white">{area}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Linked Child</p>
                  <p className="mt-1 font-semibold text-white">{linkedChild?.studentName || 'No child linked'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info */}
      {linkedChild && (
        <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Quick Information</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">Child Name</p>
              <p className="mt-2 font-semibold text-white">{linkedChild.studentName || 'N/A'}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">Status</p>
              <p className="mt-2 font-semibold text-white">
                {linkedChild.emergencyStatus === 'active' ? 'Emergency' : 'Safe'}
              </p>
            </div>
            {linkedChild.deviceBattery !== undefined && (
              <div className="rounded-2xl bg-slate-900/60 p-4">
                <p className="text-sm text-slate-400">Device Battery</p>
                <p className="mt-2 font-semibold text-white">{linkedChild.deviceBattery}%</p>
              </div>
            )}
            {linkedChild.lastLocation && (
              <div className="rounded-2xl bg-slate-900/60 p-4">
                <p className="text-sm text-slate-400">Last Location Update</p>
                <p className="mt-2 font-semibold text-white">{linkedChild.lastLocation.timestamp || 'N/A'}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {children.length === 0 && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-950/30 p-6">
          <p className="text-sm text-amber-200">No linked children found. Please check your profile settings.</p>
        </div>
      )}
    </div>
  );
}
