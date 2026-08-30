import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { collection, deleteDoc, doc, onSnapshot, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { StudentDocument } from '../../types/firestore';

export default function StudentsList() {
  const [students, setStudents] = useState<StudentDocument[]>([]);
  const [statuses, setStatuses] = useState<Record<string, any>>({});

  useEffect(() => {
    // Listen to Firestore `users` where role == 'student' so only student users are shown
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const userDocs = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      // Map to StudentDocument-like shape using available fields; additional student metadata will be joined from `students` collection below
      setStudents(userDocs.map((u: any) => ({ id: u.id, uid: u.uid || u.id, name: u.name, email: u.email, deviceId: u.deviceId } as StudentDocument)));
    });
    // Also listen to students collection for metadata (regNumber, phone, address)
    const unsubStudentMetas = onSnapshot(collection(db, 'students'), (snapshot) => {
      const metas = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as StudentDocument));
      // Merge metadata into current student list where possible
      setStudents((current) => current.map((s) => ({ ...s, ...metas.find((m) => m.uid === s.uid || m.id === s.uid) } as StudentDocument)));
    });

    // Listen to userStatus collection for realtime online/offline status
    const unsubStatus = onSnapshot(collection(db, 'userStatus'), (snapshot) => {
      const map: Record<string, any> = {};
      snapshot.docs.forEach((d) => { map[d.id] = d.data(); });
      setStatuses(map);
    });

    return () => {
      unsubUsers();
      unsubStudentMetas();
      unsubStatus();
    };
  }, []);

  const handleDelete = async (student: StudentDocument) => {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }

    const uid = (student.uid || student.id || '').toString();

    // Optimistic UI update
    setStudents((prev) => prev.filter((s) => (s.uid || s.id) !== uid && s.id !== student.id));

    try {
      // Delete any alerts linked to this student (by studentId)
      const alertsQuery = query(collection(db, 'alerts'), where('studentId', '==', uid));
      const alertsSnap = await getDocs(alertsQuery);
      for (const a of alertsSnap.docs) {
        await deleteDoc(doc(db, 'alerts', a.id));
      }

      // Unassign devices assigned to this student
      const devicesQuery = query(collection(db, 'devices'), where('assignedTo', '==', uid));
      const devicesSnap = await getDocs(devicesQuery);
      for (const d of devicesSnap.docs) {
        await updateDoc(doc(db, 'devices', d.id), { assignedTo: '' }).catch(() => {});
      }

      // Delete student metadata docs where uid == uid
      const studentMetaQuery = query(collection(db, 'students'), where('uid', '==', uid));
      const studentMetaSnap = await getDocs(studentMetaQuery);
      for (const m of studentMetaSnap.docs) {
        await deleteDoc(doc(db, 'students', m.id)).catch(() => {});
      }

      // Attempt to delete by doc id in case mapping used doc id
      try {
        await deleteDoc(doc(db, 'students', student.id));
      } catch (e) {
        // ignore
      }

      // Delete the auth/user document in `users` collection where uid == uid or doc id
      const usersQuery = query(collection(db, 'users'), where('uid', '==', uid));
      const usersSnap = await getDocs(usersQuery);
      for (const u of usersSnap.docs) {
        await deleteDoc(doc(db, 'users', u.id)).catch(() => {});
      }

      try {
        await deleteDoc(doc(db, 'users', student.id));
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('Failed to fully delete student and related data', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Students</h1>
        <p className="text-slate-400">Manage all student accounts with instant updates and responsive views.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-slate-950/30">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full border-separate border-spacing-0 text-left">
            <thead className="bg-slate-900/90 text-slate-400">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em]">Name</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em]">Reg. Number</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em]">Phone</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em]">Parent</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em]">Device ID</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em]">Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    No students have been added yet.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-t border-slate-800/80 transition-colors hover:bg-slate-900/80">
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-800 text-slate-200 shadow-inner">
                          <span className="text-sm font-semibold uppercase">
                            {student.name.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{student.name}</p>
                          <p className="text-sm text-slate-500 truncate">{student.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-300">{student.registrationNumber || '—'}</td>
                    <td className="px-6 py-5 text-sm text-slate-300">{student.phone || '—'}</td>
                    <td className="px-6 py-5 text-sm text-slate-300">{student.parentName || 'N/A'}</td>
                    <td className="px-6 py-5 text-sm text-slate-300">
                      <span className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 font-medium">
                        {student.deviceId || 'Not assigned'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {(() => {
                        const uid = (student.uid || student.id || '').toString();
                        const statusObj = statuses[uid] || statuses[student.id];
                        const isActive = statusObj?.status === 'active' || statusObj?.isOnline === true || (student as any).status === 'active';
                        return (
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => handleDelete(student)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-rose-400 transition hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
