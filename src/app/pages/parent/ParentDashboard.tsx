import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, MapPin, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ParentAnalytics from '../../components/parent/ParentAnalytics';
import ParentChildren from '../../components/parent/ParentChildren';
import { parentOverviewStats } from '../../components/parent/parentDashboardData';
import { fetchParentProfile, fetchStudentProfile, fetchStudentByParentUid, ParentProfile, StudentProfile } from '../../services/parentService';

export default function ParentDashboard() {
  const { user, loading } = useAuth();
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    if (!user?.id) {
      setParentProfile(null);
      setStudent(null);
      setLoadingDashboard(false);
      return;
    }

    let active = true;
    setDashboardError('');
    setLoadingDashboard(true);

    const loadDashboard = async () => {
      const profile = await fetchParentProfile(user.id);
      console.debug('[ParentDashboard] parent profile for', user.id, profile);
      if (!active) return;

      if (!profile) {
        setParentProfile(null);
        setStudent(null);
        setDashboardError('No linked student found');
        setLoadingDashboard(false);
        return;
      }

      setParentProfile(profile);
      // Try direct studentId fields first
      let studentId = profile.studentId || profile.linkedStudentId;
      console.debug('[ParentDashboard] extracted studentId from parent profile:', studentId);

      let studentRecord: StudentProfile | null = null;

      if (studentId) {
        studentRecord = await fetchStudentProfile(studentId);
        console.debug('[ParentDashboard] fetchStudentProfile result for', studentId, studentRecord);
      }

      // Fallback: if no studentId or fetch failed, try querying students by parentUid
      if (!studentRecord) {
        console.debug('[ParentDashboard] attempting fallback query by parentUid=', user.id);
        studentRecord = await fetchStudentByParentUid(user.id);
        console.debug('[ParentDashboard] fetchStudentByParentUid result:', studentRecord);
      }

      if (!active) return;

      if (!studentRecord) {
        setStudent(null);
        setDashboardError('No linked student found');
      } else {
        setStudent(studentRecord);
        setDashboardError('');
      }

      setLoadingDashboard(false);
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const linkedStudent = student;
  const studentStatus = useMemo(() => {
    if (!linkedStudent) return 'Unknown';
    return linkedStudent.emergencyStatus === 'active' ? 'Emergency' : 'Safe';
  }, [linkedStudent]);

  if (loading || loadingDashboard) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/90 p-10">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-slate-400" />
          <p className="mt-4 text-sm text-slate-400">Loading parent overview...</p>
        </div>
      </div>
    );
  }

  const greetingName = parentProfile?.parentName || user?.name || 'Parent';
  const alertChildName = linkedStudent?.studentName || linkedStudent?.name || 'Your student';

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Parent overview</p>
            <h1 className="text-3xl font-semibold text-white">Hello, {greetingName}.</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-400">
              Welcome to the parent portal. Track safety alerts, view student status, and review analytics for every linked child.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <div className="inline-flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                Secure monitoring enabled
              </div>
              <div className="inline-flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                <MapPin className="h-5 w-5 text-sky-300" />
                Live location available
              </div>
              <div className="inline-flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                <AlertTriangle className="h-5 w-5 text-amber-300" />
                {linkedStudent ? 'Student tracking active' : 'No student linked yet'}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {parentOverviewStats.map((stat) => (
              <div key={stat.title} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm shadow-slate-950/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{stat.title}</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{stat.title === 'Linked Students' ? (linkedStudent ? '1' : '0') : stat.value}</p>
                  </div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-800 text-slate-100">
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-sm shadow-slate-950/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Alerts snapshot</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Latest updates</h2>
            </div>
            <span className="rounded-3xl bg-amber-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
              {linkedStudent ? (studentStatus === 'Emergency' ? 'Attention' : 'Active') : 'Pending'}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Alert type</p>
              <p className="mt-2 text-lg font-semibold text-white">{linkedStudent ? 'Campus safety alert' : 'No active alerts'}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Affected child</p>
              <p className="mt-2 text-lg font-semibold text-white">{alertChildName}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm text-slate-400">Recommended action</p>
              <p className="mt-2 text-lg font-semibold text-white">Review alert details and confirm device status.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-sm shadow-slate-950/10">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Health insights</p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-3xl bg-slate-900/80 p-4">
                <p className="text-sm text-slate-400">Average device battery</p>
                <p className="mt-2 text-2xl font-semibold text-white">{linkedStudent?.deviceBattery ?? 'N/A'}%</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-4">
                <p className="text-sm text-slate-400">Latest location refresh</p>
                <p className="mt-2 text-2xl font-semibold text-white">{linkedStudent?.lastLocation?.timestamp ?? 'No recent update'}</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-sm shadow-slate-950/10">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Support</p>
            <p className="mt-4 text-sm leading-7 text-slate-400">If you need help configuring alerts or checking device status, visit the settings page or contact campus support.</p>
          </div>
        </div>
      </section>

      {dashboardError && (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-950/80 p-6 text-sm text-rose-200">
          {dashboardError}
        </div>
      )}

      <ParentAnalytics />
      <ParentChildren student={linkedStudent} />
    </div>
  );
}
