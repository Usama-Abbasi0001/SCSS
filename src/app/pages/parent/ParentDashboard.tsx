import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchParentProfile,
  subscribeStudentsByParent,
  ParentProfile,
  StudentProfile
} from '../../services/parentService';
import { buildGoogleMapsUrl } from '../../services/safetyService';
import { AlertDocument } from '../../types/firestore';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import {
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Bell,
  Clock,
  ExternalLink,
  ChevronRight,
  Shield,
  Zap,
  Activity
} from 'lucide-react';

export default function ParentDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [childAlerts, setChildAlerts] = useState<AlertDocument[]>([]);
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
    let unsubscribeAlerts = () => {};
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

    loadDashboard();

    return () => {
      active = false;
      unsubscribeChildren();
      unsubscribeAlerts();
    };
  }, [user?.id, loading]);

  if (loading || loadingDashboard) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/90 p-10">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-purple-500" />
          <p className="mt-4 text-sm text-slate-400">Loading parent dashboard…</p>
        </div>
      </div>
    );
  }

  const parentName = parentProfile?.parentName || parentProfile?.name || user?.name || 'Parent';
  const child = children[0];
  const isEmergency = child?.emergencyStatus === 'active';
  const location = child?.lastLocation || { lat: 24.8607, lng: 67.0011, timestamp: 'No GPS data yet' };
  const activeAlerts = childAlerts.filter((a) => a.status === 'active');
  const resolvedAlerts = childAlerts.filter((a) => a.status === 'resolved');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-fuchsia-400 font-semibold">Safety Control Center</span>
          <h1 className="mt-1 text-3xl font-bold text-white">Welcome back, {parentName}</h1>
          <p className="mt-1 text-slate-400">
            {child ? (
              <>Monitoring status for <span className="text-white font-medium">{child.name || child.studentName}</span> ({child.registrationNumber || 'Student'})</>
            ) : (
              'No linked child found. Please verify your student profile.'
            )}
          </p>
        </div>

        {child && (
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold self-start md:self-auto ${
            isEmergency
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            {isEmergency ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {isEmergency ? 'EMERGENCY IN PROGRESS' : 'STATUS: SAFE'}
          </span>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Child Safety Status */}
        <div
          onClick={() => navigate('/parent/child')}
          className="group cursor-pointer rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Child Safety</p>
            <div className={`p-2.5 rounded-2xl ${isEmergency ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
              {isEmergency ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{isEmergency ? 'Emergency' : 'Safe'}</p>
          <p className="mt-1 text-xs text-slate-400">{child?.name || child?.studentName || 'Not Linked'}</p>
        </div>

        {/* Live GPS Tracking */}
        <div
          onClick={() => navigate('/parent/tracking')}
          className="group cursor-pointer rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Current Location</p>
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-300">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-lg font-mono font-bold text-white truncate">
            {location.lat ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Live Stream'}
          </p>
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span className="truncate">{location.timestamp || 'GPS active'}</span>
          </p>
        </div>

        {/* Active Alerts */}
        <div
          onClick={() => navigate('/parent/alerts')}
          className="group cursor-pointer rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Active Alerts</p>
            <div className={`p-2.5 rounded-2xl ${activeAlerts.length > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{activeAlerts.length}</p>
          <p className="mt-1 text-xs text-slate-400">{resolvedAlerts.length} resolved in history</p>
        </div>

        {/* Device Status */}
        <div
          onClick={() => navigate('/parent/device-status')}
          className="group cursor-pointer rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">IoT Device</p>
            <div className="p-2.5 rounded-2xl bg-fuchsia-500/20 text-fuchsia-300">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-mono font-bold text-white">{child?.deviceId || 'Active'}</p>
          <p className="mt-1 text-xs text-slate-400">Tracking telemetry connected</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          onClick={() => navigate('/parent/tracking')}
          className="cursor-pointer rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900/90 p-6 shadow-xl hover:border-sky-500/40 transition group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Live Tracking</h3>
                <p className="text-xs text-slate-400">View real-time Google Map</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition" />
          </div>
        </div>

        <div
          onClick={() => navigate('/parent/location-updates')}
          className="cursor-pointer rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900/90 p-6 shadow-xl hover:border-emerald-500/40 transition group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Location Updates</h3>
                <p className="text-xs text-slate-400">Full location history log</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition" />
          </div>
        </div>

        <div
          onClick={() => navigate('/parent/notifications')}
          className="cursor-pointer rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900/90 p-6 shadow-xl hover:border-fuchsia-500/40 transition group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Notifications</h3>
                <p className="text-xs text-slate-400">View safety alerts & updates</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition" />
          </div>
        </div>
      </div>

      {/* Recent Alerts Feed */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent Safety Alerts</h2>
            <p className="text-xs text-slate-400">Real-time alerts triggered by your linked child</p>
          </div>
          <button
            onClick={() => navigate('/parent/alerts')}
            className="text-xs text-fuchsia-400 hover:text-fuchsia-300 font-semibold"
          >
            View All ({childAlerts.length})
          </button>
        </div>

        {childAlerts.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border border-slate-800/80 bg-slate-900/40">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">All Clear & Safe</h3>
            <p className="text-xs text-slate-400 mt-1">No emergency alerts have been triggered by your child.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {childAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/60"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                    alert.type === 'emergency' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{alert.message}</h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {alert.timestamp}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    alert.status === 'active' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {alert.status}
                  </span>
                  {alert.location?.lat && (
                    <a
                      href={buildGoogleMapsUrl(alert.location.lat, alert.location.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-sky-400 hover:text-white transition"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
