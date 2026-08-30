import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { StudentDocument } from '../../types/firestore';
import { triggerStudentSOS, buildGoogleMapsUrl } from '../../services/safetyService';
import {
  AlertTriangle,
  Phone,
  ShieldCheck,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Radio
} from 'lucide-react';

export default function EmergencyStatus() {
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentDocument | null>(null);
  const [loadingSOS, setLoadingSOS] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id && !user?.uid) return;
    const studentUid = user.uid || user.id;

    const unsubscribe = onSnapshot(
      doc(db, 'students', studentUid),
      async (snapshot) => {
        if (snapshot.exists()) {
          setStudent({ id: snapshot.id, ...snapshot.data() } as StudentDocument);
        } else if (user.email) {
          try {
            const snap = await getDocs(query(collection(db, 'students'), where('email', '==', user.email)));
            if (!snap.empty) {
              const d = snap.docs[0];
              setStudent({ id: d.id, ...d.data() } as StudentDocument);
            }
          } catch (e) {
            console.warn('[EmergencyStatus] fallback query error', e);
          }
        }
      },
      (err) => console.error('[EmergencyStatus] listener error', err)
    );

    return () => unsubscribe();
  }, [user?.id, user?.uid, user?.email]);

  // Handle cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleTriggerSOS = async () => {
    if (cooldown > 0 || loadingSOS) return;
    setLoadingSOS(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Get real device coordinates
    const getCoordinates = (): Promise<{ lat: number; lng: number }> => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({
            lat: student?.lastLocation?.lat || 24.8607,
            lng: student?.lastLocation?.lng || 67.0011
          });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () =>
            resolve({
              lat: student?.lastLocation?.lat || 24.8607,
              lng: student?.lastLocation?.lng || 67.0011
            }),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
    };

    try {
      const coords = await getCoordinates();
      const studentUid = user?.uid || user?.id || 'student';
      
      const effectiveStudent: StudentDocument = student || {
        id: studentUid,
        uid: studentUid,
        studentId: studentUid,
        name: user?.name || 'Student',
        studentName: user?.name || 'Student',
        email: user?.email || '',
        registrationNumber: (user as any)?.registrationNumber || 'Student',
        parentId: (user as any)?.parentId || '',
        parentName: (user as any)?.parentName || 'Parent',
        deviceId: (user as any)?.deviceId || 'ESP32'
      };

      await triggerStudentSOS(effectiveStudent, coords);
      setSuccessMessage('Emergency SOS alert has been broadcasted to Campus Security and your Parent!');
      setCooldown(15);
    } catch (err: any) {
      console.error('[EmergencyStatus] trigger SOS error', err);
      setErrorMessage(err.message || 'Failed to trigger SOS alert. Please retry.');
    } finally {
      setLoadingSOS(false);
    }
  };

  const handleCancelEmergency = async () => {
    if (!student) return;
    try {
      setLoadingSOS(true);
      const studentUid = student.uid || student.id;
      await updateDoc(doc(db, 'students', studentUid), {
        emergencyStatus: 'inactive'
      });
      setSuccessMessage('Emergency alarm has been deactivated.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to deactivate emergency.');
    } finally {
      setLoadingSOS(false);
    }
  };

  const isEmergency = student?.emergencyStatus === 'active';
  const location = student?.lastLocation || { lat: 24.8607, lng: 67.0011, timestamp: 'Awaiting fix' };
  const googleMapsUrl = buildGoogleMapsUrl(location.lat, location.lng);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <h1 className="text-3xl font-semibold text-white">Emergency Status & SOS Dispatch</h1>
        <p className="mt-1 text-slate-400">Instantly beacon campus security dispatch and alert your linked parent</p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Main SOS Trigger Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div
            className={`rounded-3xl p-8 sm:p-10 border-2 transition-all shadow-2xl ${
              isEmergency
                ? 'border-rose-500/60 bg-gradient-to-b from-rose-950/40 via-slate-950 to-slate-950 shadow-rose-950/30'
                : 'border-slate-800 bg-slate-950/90'
            }`}
          >
            <div className="text-center max-w-lg mx-auto space-y-6">
              {/* Pulsing Visual Icon */}
              <div className="relative inline-flex items-center justify-center">
                {isEmergency && (
                  <span className="absolute inline-flex h-36 w-36 rounded-full bg-rose-500 opacity-25 animate-ping" />
                )}
                <div
                  className={`h-28 w-28 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all ${
                    isEmergency
                      ? 'bg-rose-600 border-rose-400 text-white shadow-rose-600/50'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  }`}
                >
                  {isEmergency ? (
                    <AlertTriangle className="h-14 w-14 animate-pulse" />
                  ) : (
                    <ShieldCheck className="h-14 w-14" />
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-white">
                  {isEmergency ? 'ACTIVE EMERGENCY ALARM!' : 'Status: You are Safe'}
                </h2>
                <p className="text-sm text-slate-400 mt-2">
                  {isEmergency
                    ? 'SOS alert has been received by Campus Security control and your linked Parent.'
                    : 'No emergency alarms are currently active. Press the button below if you need immediate campus help.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {isEmergency ? (
                  <button
                    onClick={handleCancelEmergency}
                    disabled={loadingSOS}
                    className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base transition shadow-lg disabled:opacity-50"
                  >
                    {loadingSOS ? 'Updating…' : 'Cancel / Resolve Emergency'}
                  </button>
                ) : (
                  <button
                    onClick={handleTriggerSOS}
                    disabled={loadingSOS || cooldown > 0}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:brightness-110 text-white font-extrabold text-lg transition-all shadow-xl shadow-rose-600/30 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <Radio className="h-6 w-6 animate-pulse" />
                    {loadingSOS
                      ? 'Acquiring GPS & Triggering…'
                      : cooldown > 0
                      ? `Cooldown active (${cooldown}s)`
                      : 'TRIGGER EMERGENCY SOS'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Response Protocol Steps */}
          {isEmergency && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl space-y-4">
              <h3 className="font-semibold text-white text-base">Emergency Protocol in Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="h-8 w-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <p className="text-sm text-slate-200">Campus Security command center has received your alarm.</p>
                </div>

                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="h-8 w-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <p className="text-sm text-slate-200">Your parent ({student?.parentName || 'Parent'}) has been alerted.</p>
                </div>

                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="h-8 w-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <p className="text-sm text-slate-200">Live coordinates are being tracked for emergency response.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info & Helplines */}
        <div className="space-y-6">
          {/* Current Coordinates Snapshot */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-emerald-400" />
              Location Coordinates
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Latitude</span>
                <span className="font-mono text-white font-medium">{location.lat.toFixed(6)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Longitude</span>
                <span className="font-mono text-white font-medium">{location.lng.toFixed(6)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Timestamp</span>
                <span className="text-slate-200 text-xs truncate">{location.timestamp}</span>
              </div>
            </div>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-sky-400 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Google Maps
            </a>
          </div>

          {/* Emergency Hotlines */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2 text-base">
              <Phone className="h-5 w-5 text-sky-400" />
              Campus Helplines
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Security Control</p>
                  <p className="text-sm font-semibold text-white mt-0.5">+92-300-1112233</p>
                </div>
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                  <Phone className="h-4 w-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Parent: {student?.parentName || 'Linked Parent'}</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{student?.phone || 'Linked'}</p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Phone className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
