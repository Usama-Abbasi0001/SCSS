import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { collection, deleteDoc, doc, onSnapshot, query, where, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { ParentDocument, StudentDocument } from '../../types/firestore';

export default function ParentsList() {
  const [parentUsers, setParentUsers] = useState<ParentDocument[]>([]);
  const [parentMetas, setParentMetas] = useState<ParentDocument[]>([]);
  const [students, setStudents] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen to `users` where role == 'parent' to get parent users in real-time
    const parentsQuery = query(collection(db, 'users'), where('role', '==', 'parent'));
    const unsubParentUsers = onSnapshot(parentsQuery, (snapshot) => {
      setParentUsers(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as ParentDocument)));
      setLoading(false);
    });

    // Also listen to parents metadata collection (phone, cnic, address) keyed by generated doc id
    const unsubParentMetas = onSnapshot(collection(db, 'parents'), (snapshot) => {
      setParentMetas(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ParentDocument)));
    });

    // Listen to students for resolving linked student names
    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      setStudents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as StudentDocument)));
    });

    return () => {
      unsubParentUsers();
      unsubParentMetas();
      unsubStudents();
    };
  }, []);

  const handleDelete = async (userUid: string, linkedStudentId?: string) => {
    if (!confirm('Are you sure you want to delete this parent?')) {
      return;
    }

    if (linkedStudentId) {
      // linkedStudentId is stored as the student's auth UID and students doc ID
      const studentRef = doc(db, 'students', linkedStudentId);
      await updateDoc(studentRef, {
        parentId: '',
        parentName: ''
      }).catch(() => {
        // ignore if student does not exist
      });
    }

    // Delete the parent metadata document in `parents` collection where uid === userUid
    const meta = parentMetas.find((p) => p.uid === userUid);
    if (meta) {
      await deleteDoc(doc(db, 'parents', meta.id)).catch(() => {});
    }

    // Delete the parent user record from `users` collection
    try {
      await deleteDoc(doc(db, 'users', userUid));
    } catch (e) {
      // best-effort: also attempt to delete any users docs where uid === userUid
      try {
        const uQuery = query(collection(db, 'users'), where('uid', '==', userUid));
        const uSnap = await getDocs(uQuery);
        for (const u of uSnap.docs) {
          await deleteDoc(doc(db, 'users', u.id)).catch(() => {});
        }
      } catch (err) {
        // ignore
      }
    }
  };

  const getStudentName = (studentId?: string) => {
    if (!studentId) {
      return 'N/A';
    }
    // Students may be keyed by document id (which we now set to the student's auth UID)
    return students.find((s) => s.id === studentId || s.uid === studentId)?.name || 'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Parents List</h1>
        <p className="text-slate-400">Manage all registered parents from a secure admin dashboard.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-slate-950/30">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-slate-900/90 text-slate-400">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">CNIC</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Linked Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Address</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">Loading parents…</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-rose-300">{error}</td>
                </tr>
              ) : parentUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    No parents have been added yet.
                  </td>
                </tr>
              ) : (
                parentUsers.map((parent) => {
                  const meta = parentMetas.find((m) => m.uid === parent.id);
                  const phone = meta?.phone || 'N/A';
                  const cnic = meta?.cnic || 'N/A';
                  const address = meta?.address || 'N/A';
                  return (
                  <tr key={parent.id} className="border-t border-slate-800/80 transition-colors hover:bg-slate-900/80">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-800 text-slate-200 shadow-inner">
                          <span className="text-sm font-semibold uppercase">
                            {(() => {
                              const name = (parent.name || parent.email || '').toString();
                              const initials = name
                                ? name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                                : 'NA';
                              return initials;
                            })()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-white">{parent.name || parent.email || 'Unknown'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-300">{phone}</td>
                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 font-medium">
                        {cnic}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-medium text-cyan-300">
                        {getStudentName((parent as any).linkedStudentId)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-300">
                      {(address || '').length > 30 ? `${(address || '').substring(0, 30)}...` : (address || 'N/A')}
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => handleDelete(parent.id, (parent as any).linkedStudentId)}
                        className="text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
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
