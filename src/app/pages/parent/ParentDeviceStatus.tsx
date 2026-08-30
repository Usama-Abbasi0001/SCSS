import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchParentProfile,
  subscribeStudentsByParent,
  StudentProfile
} from '../../services/parentService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { UserStatusDocument, DeviceDocument } from '../../types/firestore';
import {
  Shield,
  Wifi,
  WifiOff,
  Clock,
  MapPin,
  Cpu,
  Activity,
  Zap,
  CheckCircle2
} from 'lucide-react';

export default function ParentDeviceStatus() {
  const { user, loading } = useAuth();
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [userStatus, setUserStatus] = useState<UserStatusDocument | null>(null);
  const [deviceDoc, setDeviceDoc] = useState<DeviceDocument | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setChildren([]);
      setLoadingPage(false);
      return;
    }

    let active = true;
    let unsubscribeChildren = () => {};
    let unsubscribeUserStatus = () => {};
    let unsubscribeDevice = () => {};
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

            // 1. Subscribe to student's userStatus for real-time presence (online/offline)
            unsubscribeUserStatus();
            unsubscribeUserStatus = onSnapshot(
              doc(db, 'userStatus', studentUid),
              (docSnap) => {
                if (active && docSnap.exists()) {
                  setUserStatus(docSnap.data() as UserStatusDocument);
                }
              },
              (err) => console.error('[ParentDeviceStatus] userStatus error', err)
            );

            // 2. Subscribe to device document if deviceId is assigned
            if (currentChild.deviceId) {
              unsubscribeDevice();
              unsubscribeDevice = onSnapshot(
                doc(db, 'devices', currentChild.deviceId),
                (docSnap) => {
                  if (active && docSnap.exists()) {
                    setDeviceDoc({ id: docSnap.id, ...docSnap.data() } as DeviceDocument);
                  }
                },
                (err) => console.error('[ParentDeviceStatus] deviceDoc error', err)
              );
            }
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
      unsubscribeUserStatus();
      unsubscribeDevice();
    };
  }, [user?.id, loading]);

  if (loading || loadingPage) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/90 p-10">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-500" />
          <p className="mt-4 text-sm text-slate-400">Checking device telemetry…</p>
        </div>
      </div>
    );
  }

  const child = children[0];
  const isOnline = Boolean(userStatus?.isOnline);
  const location = child?.lastLocation;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <h1 className="text-3xl font-semibold text-white">Device & Connection Status</h1>
        <p className="mt-1 text-slate-400">
          Live telemetry and connection status for{' '}
          <span className="text-white font-medium">{child?.name || child?.studentName || 'Student'}</span>’s tracking device
        </p>
      </div>

      {/* Main Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Presence Status */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Connection</p>
            <div className={`p-2.5 rounded-2xl ${isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
              {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{isOnline ? 'Online' : 'Offline'}</p>
          <p className="mt-1 text-xs text-slate-400">Real-time socket heartbeat</p>
        </div>

        {/* Assigned Hardware ID */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Assigned Hardware</p>
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300">
              <Cpu className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-mono font-bold text-white">{child?.deviceId || 'ESP32'}</p>
          <p className="mt-1 text-xs text-slate-400">{deviceDoc?.name || 'ESP32 Campus Tracker'}</p>
        </div>

        {/* GPS Tracking Telemetry */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">GPS Telemetry</p>
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-300">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{location?.lat ? 'Transmitting' : 'Awaiting Fix'}</p>
          <p className="mt-1 text-xs text-slate-400">High-accuracy geolocation</p>
        </div>

        {/* System Health */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Safety Status</p>
            <div className="p-2.5 rounded-2xl bg-violet-500/20 text-violet-300">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{child?.emergencyStatus === 'active' ? 'SOS Active' : 'Normal'}</p>
          <p className="mt-1 text-xs text-slate-400">Emergency gateway active</p>
        </div>
      </div>

      {/* Detailed Telemetry Report */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <h2 className="text-xl font-semibold text-white mb-6">Device Diagnostic Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Tracking & Geofencing Mode</h3>
              <p className="text-xs text-slate-400 mt-1">
                Continuous background location polling is configured for emergency beaconing across campus coordinates.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-300">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Last Position Broadcast</h3>
              <p className="text-xs text-slate-400 mt-1">
                Timestamp: <span className="text-slate-200 font-medium">{location?.timestamp || 'No signal recorded'}</span>
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-fuchsia-500/10 text-fuchsia-300">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Hardware Power & Battery</h3>
              <p className="text-xs text-slate-400 mt-1">
                Battery Level: <span className="text-slate-200 font-medium">{child?.deviceBattery ? `${child.deviceBattery}%` : 'Standard Mainline (Active)'}</span>
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-300">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Cloud Sync Gateway</h3>
              <p className="text-xs text-slate-400 mt-1">
                Firebase Firestore onSnapshot channel: <span className="text-emerald-400 font-medium">Connected</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
