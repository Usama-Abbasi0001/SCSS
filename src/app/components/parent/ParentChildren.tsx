import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { MapPin, BatteryCharging, ShieldCheck, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../../config/firebase';
import { fetchParentProfile, StudentProfile } from '../../services/parentService';

interface ParentChildrenProps {
  students?: StudentProfile[] | null;
}

export default function ParentChildren({ students }: ParentChildrenProps) {
  const { user } = useAuth();
  const [localStudents, setLocalStudents] = useState<StudentProfile[] | null>(students ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.debug('[ParentChildren] useEffect start', {
      userId: user?.id,
      authUid: auth.currentUser?.uid,
      studentsProp: students
    });

    if (students !== undefined) {
      console.debug('[ParentChildren] students prop provided', { count: students?.length ?? 0 });
      setLocalStudents(students);
      setLoading(false);
      return;
    }

    if (!user?.id) {
      console.debug('[ParentChildren] no authenticated parent user id, clearing local students');
      setLocalStudents(null);
      setLoading(false);
      return;
    }

    let active = true;
    let unsubscribe = () => {};
    setLoading(true);
    setError('');

    const subscribeChildren = async () => {
      try {
        const parentProfile = await fetchParentProfile(user.id);
        console.debug('[ParentChildren] fetchParentProfile result', { parentProfile });
        if (!active) {
          return;
        }

        const parentId = parentProfile?.id;
        const studentMap = new Map<string, StudentProfile>();

        const updateChildren = () => {
          if (!active) return;
          const values = Array.from(studentMap.values());
          console.debug('[ParentChildren] updateChildren', { count: values.length });
          setLocalStudents(values);
          setLoading(false);
        };

        const subscribeQuery = (q: ReturnType<typeof query>, name: string) =>
          onSnapshot(
            q,
            (snapshot) => {
              console.debug('[ParentChildren] onSnapshot', {
                queryName: name,
                queryParentUid: user.id,
                queryParentId: parentId,
                snapshotSize: snapshot.size,
                docChanges: snapshot.docChanges().map((change) => ({ id: change.doc.id, type: change.type }))
              });

              snapshot.docChanges().forEach((change) => {
                const docData = change.doc.data() as StudentProfile;
                const childRecord: StudentProfile = { id: change.doc.id, ...(docData as Omit<StudentProfile, 'id'>) };

                if (change.type === 'removed') {
                  studentMap.delete(change.doc.id);
                } else {
                  studentMap.set(change.doc.id, childRecord);
                }
              });

              updateChildren();
            },
            (error) => {
              console.error('[ParentChildren] onSnapshot error', { queryName: name, error });
              updateChildren();
            }
          );

        const subscriptions = [
          subscribeQuery(query(collection(db, 'students'), where('parentUid', '==', user.id)), 'parentUid')
        ];

        if (parentId) {
          subscriptions.push(subscribeQuery(query(collection(db, 'students'), where('parentId', '==', parentId)), 'parentId'));
        }

        unsubscribe = () => subscriptions.forEach((unsub) => unsub());
      } catch (error) {
        console.error('[ParentChildren] subscribeChildren failed', error);
        setError('Unable to load linked students.');
        setLoading(false);
      }
    };

    subscribeChildren();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [students, user?.id]);

  const children = localStudents ?? [];
  const hasChildren = children.length > 0;

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 shadow-xl shadow-slate-950/20">
        <p className="text-sm text-slate-400">Loading linked student information...</p>
      </div>
    );
  }

  if (!hasChildren) {
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
            <h2 className="mt-2 text-3xl font-semibold text-white">Your linked student{children.length > 1 ? 's' : ''}</h2>
            <p className="mt-2 text-sm text-slate-400">{children.length} linked child{children.length > 1 ? 'ren' : ''} are available for monitoring.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800">
            <Bell className="h-4 w-4 text-slate-300" />
            View alerts
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {children.map((child) => {
          const childStatus = child.emergencyStatus === 'active' ? 'Emergency' : 'Safe';
          return (
            <div key={child.id} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm shadow-slate-950/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{child.studentName || child.name || 'Unnamed Student'}</p>
                  <p className="mt-1 text-sm text-slate-400">{child.registrationNumber || child.studentId || child.uid || 'Student ID unavailable'}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    childStatus === 'Safe' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                  }`}
                >
                  {childStatus}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Current Location</span>
                  </div>
                  <p className="text-sm text-white">
                    {child.lastLocation?.timestamp
                      ? `${child.lastLocation.timestamp} • ${child.lastLocation.lat.toFixed(3)}, ${child.lastLocation.lng.toFixed(3)}`
                      : 'Location updates are not available yet.'}
                  </p>
                </div>
                <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <BatteryCharging className="h-4 w-4" />
                    <span className="text-sm">Device battery</span>
                  </div>
                  <p className="text-sm text-white">{child.deviceBattery ?? 'Unknown'}%</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                  <p className="text-sm text-slate-400">Assigned device</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{child.deviceId || 'Not assigned'}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                  <p className="text-sm text-slate-400">Last update</p>
                  <p className="mt-2 text-sm font-semibold text-white">{child.lastLocation?.timestamp ?? 'No recent update'}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <p className="text-sm">Connected device and campus safety monitoring active.</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
