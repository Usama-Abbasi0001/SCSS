import { useEffect, useMemo, useState } from 'react';
import { MapPin, BatteryCharging, ShieldCheck, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchParentProfile, fetchStudentProfile, StudentProfile } from '../../services/parentService';

interface ParentChildrenProps {
  student?: StudentProfile | null;
}

export default function ParentChildren({ student }: ParentChildrenProps) {
  const { user } = useAuth();
  const [localStudent, setLocalStudent] = useState<StudentProfile | null>(student ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (student !== undefined) {
      setLocalStudent(student);
      return;
    }

    if (!user?.id) {
      setLocalStudent(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    const loadStudent = async () => {
      const parentProfile = await fetchParentProfile(user.id);
      if (!active) {
        return;
      }

      const studentId = parentProfile?.studentId || parentProfile?.linkedStudentId;
      if (!studentId) {
        setLocalStudent(null);
        setError('No student linked to your account.');
        setLoading(false);
        return;
      }

      const fetchedStudent = await fetchStudentProfile(studentId);
      if (!active) {
        return;
      }

      if (!fetchedStudent) {
        setLocalStudent(null);
        setError('Linked student record was not found.');
      } else {
        setLocalStudent(fetchedStudent);
      }
      setLoading(false);
    };

    loadStudent();

    return () => {
      active = false;
    };
  }, [student, user?.id]);

  const linkedStudent = student ?? localStudent;
  const status = useMemo(() => {
    if (!linkedStudent) {
      return 'No data';
    }

    return linkedStudent.emergencyStatus === 'active' ? 'Emergency' : 'Safe';
  }, [linkedStudent]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 shadow-xl shadow-slate-950/20">
        <p className="text-sm text-slate-400">Loading linked student information...</p>
      </div>
    );
  }

  if (!linkedStudent) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Child roster</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">No linked student found</h2>
          </div>
          <button className="inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800">
            <Bell className="h-4 w-4 text-slate-300" />
            Review account settings
          </button>
        </div>
        <p className="mt-6 text-sm text-slate-400">{error || 'Add a student link in the admin panel or contact your campus administrator.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Child roster</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Your linked student</h2>
          </div>
          <button className="inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800">
            <Bell className="h-4 w-4 text-slate-300" />
            View alerts
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm shadow-slate-950/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-white">{linkedStudent.studentName || linkedStudent.name || 'Unnamed Student'}</p>
            <p className="mt-1 text-sm text-slate-400">{linkedStudent.registrationNumber || linkedStudent.studentId || linkedStudent.uid || 'Student ID unavailable'}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              status === 'Safe' ? 'bg-emerald-500/10 text-emerald-300' : status === 'Emergency' ? 'bg-rose-500/10 text-rose-300' : 'bg-amber-500/10 text-amber-300'
            }`}
          >
            {status}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">Current Location</span>
            </div>
            <p className="text-sm text-white">
              {linkedStudent.lastLocation?.timestamp
                ? `${linkedStudent.lastLocation.timestamp} • ${linkedStudent.lastLocation.lat.toFixed(3)}, ${linkedStudent.lastLocation.lng.toFixed(3)}`
                : 'Location updates are not available yet.'}
            </p>
          </div>
          <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <BatteryCharging className="h-4 w-4" />
              <span className="text-sm">Device battery</span>
            </div>
            <p className="text-sm text-white">{linkedStudent.deviceBattery ?? 'Unknown'}%</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
            <p className="text-sm text-slate-400">Assigned device</p>
            <p className="mt-2 text-2xl font-semibold text-white">{linkedStudent.deviceId || 'Not assigned'}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
            <p className="text-sm text-slate-400">Last update</p>
            <p className="mt-2 text-sm font-semibold text-white">{linkedStudent.lastLocation?.timestamp ?? 'No recent update'}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          <p className="text-sm">Connected device and campus safety monitoring active.</p>
        </div>
      </div>
    </div>
  );
}
