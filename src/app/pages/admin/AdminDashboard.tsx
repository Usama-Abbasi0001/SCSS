import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, Shield } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import StatCard from '../../components/dashboard/StatCard';
import AlertBadge from '../../components/dashboard/AlertBadge';
import { db } from '../../../config/firebase';
import { StudentDocument, ParentDocument, DeviceDocument, AlertDocument } from '../../types/firestore';

export default function AdminDashboard() {
  const [students, setStudents] = useState<StudentDocument[]>([]);
  const navigate = useNavigate();
  const [parents, setParents] = useState<ParentDocument[]>([]);
  const [usersByRole, setUsersByRole] = useState<{ admins: any[]; parents: any[]; students: any[] }>({ admins: [], parents: [], students: [] });
  const [devices, setDevices] = useState<DeviceDocument[]>([]);
  const [alerts, setAlerts] = useState<AlertDocument[]>([]);

  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      setStudents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as StudentDocument));
    });

    const unsubParents = onSnapshot(collection(db, 'parents'), (snapshot) => {
      setParents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ParentDocument));
    });

    const unsubDevices = onSnapshot(collection(db, 'devices'), (snapshot) => {
      setDevices(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as DeviceDocument));
    });

    const unsubAlerts = onSnapshot(collection(db, 'alerts'), (snapshot) => {
      setAlerts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AlertDocument));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsersByRole({
        admins: all.filter((u: any) => u.role === 'admin'),
        parents: all.filter((u: any) => u.role === 'parent'),
        students: all.filter((u: any) => u.role === 'student')
      });
    });

    return () => {
      unsubStudents();
      unsubParents();
      unsubDevices();
      unsubAlerts();
      unsubUsers();
    };
  }, []);

  const activeAlerts = alerts.filter((alert) => alert.status === 'active');
  const activeDevices = devices.filter((device) => device.status === 'active' && device.assignedTo);
  const recentAlerts = [...alerts].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  }).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 max-w-2xl">Welcome back! Monitor campus safety, student activity, and live alerts from one secure control center.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Students" value={students.length} icon={Users} color="blue" />
        <StatCard title="Total Parents" value={parents.length} icon={Users} color="purple" />
        <div onClick={() => navigate('/admin/active-devices')} className="cursor-pointer">
          <StatCard title="Active Devices" value={activeDevices.length} icon={Shield} color="green" />
        </div>
        <div onClick={() => navigate('/admin/active-alerts')} className="cursor-pointer">
          <StatCard title="Active Alerts" value={activeAlerts.length} icon={AlertTriangle} color="red" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/30">
          <h2 className="text-xl font-semibold text-white mb-4">Users by Role</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-950/90 p-5 border border-slate-800">
              <h3 className="text-sm uppercase tracking-[0.24em] text-slate-400">Admins</h3>
              <p className="mt-3 text-3xl font-semibold text-white">{usersByRole.admins.length}</p>
              {/* Removed listing of admin names to keep statistics summary-only */}
            </div>
            <div className="rounded-3xl bg-slate-950/90 p-5 border border-slate-800">
              <h3 className="text-sm uppercase tracking-[0.24em] text-slate-400">Parents</h3>
              <p className="mt-3 text-3xl font-semibold text-white">{usersByRole.parents.length}</p>
              {/* Removed listing of parent names to keep statistics summary-only */}
            </div>
            <div className="rounded-3xl bg-slate-950/90 p-5 border border-slate-800">
              <h3 className="text-sm uppercase tracking-[0.24em] text-slate-400">Students</h3>
              <p className="mt-3 text-3xl font-semibold text-white">{usersByRole.students.length}</p>
              {/* Removed listing of student names to keep statistics summary-only */}
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Alerts</h2>
            <AlertBadge type="emergency">{activeAlerts.length} Active</AlertBadge>
          </div>
          <div className="space-y-4">
            {recentAlerts.length === 0 ? (
              <p className="text-sm text-slate-500">There are no alerts to display.</p>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4">
                  <div className="flex-shrink-0">
                    <AlertTriangle className={`w-5 h-5 ${
                      alert.type === 'emergency' ? 'text-rose-400' :
                      alert.type === 'warning' ? 'text-amber-400' : 'text-sky-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{alert.studentName}</p>
                    <p className="text-sm text-slate-300">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{alert.timestamp}</p>
                  </div>
                  <AlertBadge type={alert.type}>{alert.type}</AlertBadge>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/30">
          <h2 className="text-xl font-semibold text-white mb-6">Emergency Status</h2>
          <div className="space-y-4">
            {students.length === 0 ? (
              <p className="text-sm text-slate-500">No students registered yet.</p>
            ) : (
              students.map((student) => (
                <div key={student.id} className="flex items-center justify-between rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      student.emergencyStatus === 'active' ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'
                    }`} />
                    <div>
                      <p className="font-medium text-white">{student.name}</p>
                      <p className="text-sm text-slate-400">{student.registrationNumber}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    student.emergencyStatus === 'active'
                      ? 'bg-rose-500/15 text-rose-300'
                      : 'bg-emerald-500/15 text-emerald-300'
                  }`}>
                    {student.emergencyStatus ?? 'inactive'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
