import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { AlertDocument, StudentDocument } from '../../types/firestore';
import { buildGoogleMapsUrl } from '../../services/safetyService';
import {
  MapPin,
  AlertTriangle,
  Bell,
  User,
  ShieldCheck,
  Zap,
  Clock,
  ExternalLink,
  ChevronRight,
  Shield
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentDocument | null>(null);
  const [alerts, setAlerts] = useState<AlertDocument[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    if (!user?.id && !user?.uid) {
      setStudent(null);
      setLoadingDashboard(false);
      return;
    }

    const studentUid = user.uid || user.id;
    let active = true;
    let unsubscribeStudent = () => {};
    let unsubscribeAlerts = () => {};
    setLoadingDashboard(true);

    const studentRef = doc(db, 'students', studentUid);
    unsubscribeStudent = onSnapshot(
      studentRef,
      async (snapshot) => {
        if (!active) return;
        if (snapshot.exists()) {
          setStudent({ id: snapshot.id, ...snapshot.data() } as StudentDocument);
          setLoadingDashboard(false);
        } else {
          // Fallback: search by registrationNumber or email
          const q = query(
            collection(db, 'students'),
            where('email', '==', user.email || '')
          );
          const snap = await getDocs(q);
          if (active && !snap.empty) {
            const d = snap.docs[0];
            setStudent({ id: d.id, ...d.data() } as StudentDocument);
          } else {
            setStudent(null);
          }
          setLoadingDashboard(false);
        }
      },
      (err) => {
        console.error('[StudentDashboard] student snapshot error', err);
        setLoadingDashboard(false);
      }
    );

    // Subscribe to student alerts
    const alertsQuery = query(collection(db, 'alerts'), where('studentId', '==', studentUid));
    unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      if (!active) return;
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AlertDocument);
      items.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setAlerts(items);
    });

    return () => {
      active = false;
      unsubscribeStudent();
      unsubscribeAlerts();
    };
  }, [user?.id, user?.uid, user?.email]);

  if (loading || loadingDashboard) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/90 p-10">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
          <p className="mt-4 text-sm text-slate-400">Loading student dashboard…</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
          <User className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold text-white">Student Dashboard</h1>
        <p className="mt-2 text-slate-400">
          No student profile found in Firestore for this account. Please contact the campus admin.
        </p>
      </div>
    );
  }

  const isEmergency = student.emergencyStatus === 'active';
  const location = student.lastLocation || { lat: 24.8607, lng: 67.0011, timestamp: 'No GPS broadcast yet' };
  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const resolvedAlerts = alerts.filter((a) => a.status === 'resolved');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-emerald-400 font-semibold">Campus Safety Portal</span>
          <h1 className="mt-1 text-3xl font-bold text-white">Welcome back, {student.name}</h1>
          <p className="mt-1 text-slate-400">
            Registration: <span className="text-slate-200 font-mono font-medium">{student.registrationNumber || 'N/A'}</span> • Linked Parent: <span className="text-slate-200 font-medium">{student.parentName || 'Linked'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold ${
            isEmergency
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            {isEmergency ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {isEmergency ? 'EMERGENCY ACTIVE' : 'STATUS: SAFE'}
          </span>

          <button
            onClick={() => navigate('/student/emergency')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg ${
              isEmergency
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:brightness-110 shadow-rose-600/30'
            }`}
          >
            {isEmergency ? 'Manage SOS' : 'Trigger SOS'}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Emergency Status Card */}
        <div
          onClick={() => navigate('/student/emergency')}
          className="group cursor-pointer rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">SOS Status</p>
            <div className={`p-2.5 rounded-2xl ${isEmergency ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
              {isEmergency ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{isEmergency ? 'Active Alarm' : 'Safe'}</p>
          <p className="mt-1 text-xs text-slate-400">Click to view/trigger emergency</p>
        </div>

        {/* GPS Location Card */}
        <div
          onClick={() => navigate('/student/location')}
          className="group cursor-pointer rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">GPS Location</p>
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-300">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-lg font-mono font-bold text-white truncate">
            {location.lat ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Awaiting GPS'}
          </p>
          <p className="mt-1 text-xs text-slate-400 truncate flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            {location.timestamp || 'GPS online'}
          </p>
        </div>

        {/* Alert History Card */}
        <div
          onClick={() => navigate('/student/alerts')}
          className="group cursor-pointer rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total Alerts</p>
            <div className={`p-2.5 rounded-2xl ${alerts.length > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'}`}>
              <Bell className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{alerts.length}</p>
          <p className="mt-1 text-xs text-slate-400">{activeAlerts.length} active • {resolvedAlerts.length} resolved</p>
        </div>

        {/* Tracking Device Status */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">IoT Device</p>
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-mono font-bold text-white">{student.deviceId || 'ESP32'}</p>
          <p className="mt-1 text-xs text-slate-400">Assigned safety beacon</p>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          onClick={() => navigate('/student/location')}
          className="cursor-pointer rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl hover:border-sky-500/40 transition group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Live Geolocation</h3>
                <p className="text-xs text-slate-400">Track & transmit GPS coordinates</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition" />
          </div>
        </div>

        <div
          onClick={() => navigate('/student/emergency')}
          className="cursor-pointer rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl hover:border-rose-500/40 transition group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Emergency SOS</h3>
                <p className="text-xs text-slate-400">Instantly beacon campus security</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition" />
          </div>
        </div>

        <div
          onClick={() => navigate('/student/profile')}
          className="cursor-pointer rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl hover:border-emerald-500/40 transition group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Student Profile</h3>
                <p className="text-xs text-slate-400">Parent contact & account info</p>
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
            <h2 className="text-xl font-semibold text-white">My Alert History</h2>
            <p className="text-xs text-slate-400">Your past SOS activations and safety events</p>
          </div>
          <button
            onClick={() => navigate('/student/alerts')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            View All ({alerts.length})
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border border-slate-800/80 bg-slate-900/40">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">No Active Alerts</h3>
            <p className="text-xs text-slate-400 mt-1">You are currently safe. Press SOS if you require assistance.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 4).map((alert) => (
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
