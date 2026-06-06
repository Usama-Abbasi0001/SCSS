import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchParentProfile,
  subscribeStudentsByParent,
  ParentProfile,
  StudentProfile
} from '../../services/parentService';
import { MapPin, User, Phone, Badge, Zap } from 'lucide-react';

export default function MyChild() {
  const { user, loading } = useAuth();
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
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

      setParentProfile(profile);
      if (!profile) {
        setChildren([]);
        setLoadingPage(false);
        return;
      }

      unsubscribeChildren = subscribeStudentsByParent(user.id, profile?.id, (updatedChildren) => {
        if (!active) return;
        setChildren(updatedChildren);
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
          <p className="mt-4 text-sm text-slate-400">Loading child information...</p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8">
        <h1 className="text-2xl font-semibold text-white">My Child</h1>
        <p className="mt-4 text-slate-400">No linked child found. Please check your profile settings.</p>
      </div>
    );
  }

  const child = children[0];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <h1 className="text-3xl font-semibold text-white">My Child</h1>
        <p className="mt-2 text-slate-400">Student profile and current status</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Section - Profile Info */}
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Student Name</p>
              <p className="mt-2 text-2xl font-semibold text-white">{child.studentName || 'N/A'}</p>
            </div>

            {child.registrationNumber && (
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Registration Number</p>
                <p className="mt-2 text-lg font-semibold text-white">{child.registrationNumber}</p>
              </div>
            )}

            {child.grade && (
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Grade / Class</p>
                <p className="mt-2 text-lg font-semibold text-white">{child.grade}</p>
              </div>
            )}
          </div>

          {/* Right Section - Status */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Current Status</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {child.emergencyStatus === 'active' ? 'Emergency' : 'Safe'}
                  </p>
                </div>
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                    child.emergencyStatus === 'active' ? 'bg-red-500/10 text-red-300' : 'bg-emerald-500/10 text-emerald-300'
                  }`}
                >
                  <Badge className="h-5 w-5" />
                </div>
              </div>
            </div>

            {child.deviceBattery !== undefined && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Device Battery</p>
                    <p className="mt-2 text-lg font-semibold text-white">{child.deviceBattery}%</p>
                  </div>
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                      child.deviceBattery > 50 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    <Zap className="h-5 w-5" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Information */}
      {child.lastLocation && (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-sky-400" />
              <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Location Information</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {child.lastLocation.latitude && child.lastLocation.longitude && (
                <div className="rounded-2xl bg-slate-900/60 p-4">
                  <p className="text-xs text-slate-400">Coordinates</p>
                  <p className="mt-2 font-mono text-sm text-white">
                    {child.lastLocation.latitude}, {child.lastLocation.longitude}
                  </p>
                </div>
              )}

              {child.lastLocation.timestamp && (
                <div className="rounded-2xl bg-slate-900/60 p-4">
                  <p className="text-xs text-slate-400">Last Update</p>
                  <p className="mt-2 font-semibold text-white">{child.lastLocation.timestamp}</p>
                </div>
              )}

              {child.lastLocation.area && (
                <div className="rounded-2xl bg-slate-900/60 p-4 md:col-span-2">
                  <p className="text-xs text-slate-400">Area / Location</p>
                  <p className="mt-2 font-semibold text-white">{child.lastLocation.area}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Additional Details */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <p className="text-sm uppercase tracking-[0.15em] text-slate-500">Additional Information</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {child.phoneNumber && (
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <p className="text-xs text-slate-400">Phone Number</p>
              </div>
              <p className="mt-2 font-semibold text-white">{child.phoneNumber}</p>
            </div>
          )}

          {child.email && (
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <p className="text-xs text-slate-400">Email</p>
              </div>
              <p className="mt-2 font-semibold text-white">{child.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
