import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { StudentDocument } from '../../types/firestore';

export default function ActiveDevices() {
  const [students, setStudents] = useState<StudentDocument[]>([]);
  const [statuses, setStatuses] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as StudentDocument)));
    });

    const unsubStatus = onSnapshot(collection(db, 'userStatus'), (snap) => {
      const map: Record<string, any> = {};
      snap.docs.forEach((d) => (map[d.id] = d.data()));
      setStatuses(map);
    });

    return () => {
      unsubStudents();
      unsubStatus();
    };
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Active Devices</h1>
        <p className="text-slate-400 mt-2">List of devices and their real-time status and location.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-slate-950/30">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full border-separate border-spacing-0 text-left">
            <thead className="bg-slate-900/90 text-slate-400">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em]">Student Name</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em]">Parent Name</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em]">Device ID</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em]">Online Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em]">Last Active</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em]">Current Location</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    No devices or students available.
                  </td>
                </tr>
              ) : (
                students.map((s) => {
                  const uid = (s.uid || s.id || '').toString();
                  const statusObj = statuses[uid] || statuses[s.id];
                  const isActive = statusObj?.status === 'active' || statusObj?.isOnline === true || (s as any).status === 'active';
                  const lastActive = statusObj?.lastActive ? (statusObj.lastActive?.toDate ? statusObj.lastActive.toDate().toLocaleString() : new Date(statusObj.lastActive).toLocaleString()) : '—';
                  const loc = s.lastLocation ? `${s.lastLocation.lat.toFixed(4)}, ${s.lastLocation.lng.toFixed(4)}` : '—';

                  return (
                    <tr key={s.id} className="border-t border-slate-800/80 hover:bg-slate-900/80 transition-colors">
                      <td className="px-6 py-5 text-white">{s.name}</td>
                      <td className="px-6 py-5 text-slate-300">{s.parentName || 'N/A'}</td>
                      <td className="px-6 py-5 text-slate-300">{s.deviceId || '—'}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-300">{lastActive}</td>
                      <td className="px-6 py-5 text-slate-300">{loc}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
