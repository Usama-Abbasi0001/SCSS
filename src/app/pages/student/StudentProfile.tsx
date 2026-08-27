import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { StudentDocument } from '../../types/firestore';
import {
  Phone,
  MapPin,
  Users,
  Shield,
  Hash,
  Mail,
  BookOpen,
  User,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function StudentProfile() {
  const { user, loading } = useAuth();
  const [student, setStudent] = useState<StudentDocument | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user?.id && !user?.uid) {
      setStudent(null);
      setLoadingProfile(false);
      return;
    }

    const studentUid = user.uid || user.id;
    let active = true;
    setLoadingProfile(true);

    const studentRef = doc(db, 'students', studentUid);
    const unsubscribe = onSnapshot(
      studentRef,
      async (snapshot) => {
        if (!active) return;
        if (snapshot.exists()) {
          setStudent({ id: snapshot.id, ...snapshot.data() } as StudentDocument);
          setLoadingProfile(false);
        } else {
          const q = query(collection(db, 'students'), where('email', '==', user.email || ''));
          const snap = await getDocs(q);
          if (active && !snap.empty) {
            const d = snap.docs[0];
            setStudent({ id: d.id, ...d.data() } as StudentDocument);
          } else {
            setStudent(null);
          }
          setLoadingProfile(false);
        }
      },
      (err) => {
        console.error('[StudentProfile] error', err);
        setLoadingProfile(false);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.id, user?.uid, user?.email]);

  if (loading || loadingProfile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/90 p-10">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
          <p className="mt-4 text-sm text-slate-400">Loading student profile…</p>
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
        <h1 className="text-2xl font-semibold text-white">Student Profile</h1>
        <p className="mt-2 text-slate-400">No profile data found in Firestore for this account.</p>
      </div>
    );
  }

  const isEmergency = student.emergencyStatus === 'active';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <div>
          <h1 className="text-3xl font-semibold text-white">Student Profile</h1>
          <p className="mt-1 text-slate-400">Your campus registration, personal information, and safety status</p>
        </div>

        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold self-start sm:self-auto ${
          isEmergency
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
        }`}>
          {isEmergency ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          {isEmergency ? 'SOS ALARM ACTIVE' : 'SAFETY STATUS: SAFE'}
        </span>
      </div>

      {/* Main Profile Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/95 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 h-32" />
        <div className="px-6 pb-8 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-16 mb-6">
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-slate-900 rounded-3xl shadow-2xl flex items-center justify-center border-4 border-slate-950 text-emerald-400 font-bold text-3xl sm:text-4xl flex-shrink-0">
              {(student.name || 'Student').split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="pb-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">{student.name}</h2>
              <p className="text-slate-400 flex items-center gap-2 mt-1">
                <Hash className="h-4 w-4 text-emerald-400" />
                Registration: <span className="text-slate-200 font-mono font-medium">{student.registrationNumber || 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-300">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Phone Number</p>
                <p className="mt-1 font-semibold text-white">{student.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-300">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Email Address</p>
                <p className="mt-1 font-semibold text-white">{student.email || user?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-300">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Campus Residence / Address</p>
                <p className="mt-1 font-semibold text-white">{student.address || 'Main Campus'}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-fuchsia-500/10 text-fuchsia-300">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Linked Parent</p>
                <p className="mt-1 font-semibold text-white">{student.parentName || 'Linked Parent'}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-300">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Academic Class</p>
                <p className="mt-1 font-semibold text-white">{student.class || student.grade || 'Campus Regular'}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-300">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Assigned Safety Beacon</p>
                <p className="mt-1 font-mono font-semibold text-white">{student.deviceId || 'ESP32-TRACKER'}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5">
            <h3 className="font-semibold text-emerald-200 text-sm">Emergency Protection & Live Beacon Active</h3>
            <p className="text-xs text-emerald-300/80 mt-1">
              Your safety telemetry is securely registered with campus security. If you encounter any hazard or urgent emergency, use the Emergency Status SOS trigger immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
