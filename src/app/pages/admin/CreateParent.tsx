import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle } from 'lucide-react';
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FIREBASE_API_KEY } from '../../../config/firebase';
import { createAuthUserWithoutLogin } from '../../utils/adminAuth';
import { StudentDocument } from '../../types/firestore';

const initialParentFormData = {
  name: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  cnic: '',
  linkedStudentId: ''
};

export default function CreateParent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialParentFormData);
  const [students, setStudents] = useState<StudentDocument[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStudents = async () => {
      const snapshot = await getDocs(collection(db, 'students'));
      setStudents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as StudentDocument)));
    };

    loadStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.address || !formData.cnic) {
      setError('Please fill all required fields and provide email/password.');
      return;
    }

    try {
      // Create auth user via REST to avoid changing current auth state
      const created = await createAuthUserWithoutLogin(FIREBASE_API_KEY, formData.email.trim(), formData.password);
      const uid = created.localId as string;

      // Build parent profile for `users` collection
      const parentProfile: any = {
        uid,
        name: formData.name,
        parentName: formData.name,
        email: formData.email.trim(),
        role: 'parent' as const,
        status: 'active',
        createdAt: serverTimestamp()
      };

      // Only include linkedStudentId when a student was explicitly selected
      if (formData.linkedStudentId) {
        parentProfile.linkedStudentId = formData.linkedStudentId;
      }

      await setDoc(doc(db, 'users', uid), parentProfile);

      const selectedStudent = students.find((student) => student.id === formData.linkedStudentId);

      console.debug('[CreateParent] created user uid=', uid, 'parentProfile=', parentProfile, 'selectedStudent=', selectedStudent);

      const parentData: any = {
        uid,
        name: formData.name,
        parentName: formData.name,
        email: formData.email.trim(),
        role: 'parent',
        phone: formData.phone,
        address: formData.address,
        cnic: formData.cnic,
        createdAt: new Date().toISOString()
      };

      if (formData.linkedStudentId) {
        parentData.linkedStudentId = formData.linkedStudentId;
        parentData.studentId = formData.linkedStudentId;
        parentData.studentName = selectedStudent?.name || selectedStudent?.studentName || '';
        parentData.children = [formData.linkedStudentId];
      }

      const parentRef = doc(db, 'parents', uid);
      await setDoc(parentRef, parentData, { merge: true });

      await setDoc(
        doc(db, 'userStatus', uid),
        { status: 'active', lastActive: serverTimestamp(), role: 'parent' },
        { merge: true }
      );

      if (formData.linkedStudentId) {
        try {
          const studentRef = doc(db, 'students', formData.linkedStudentId);
          await updateDoc(studentRef, {
            parentId: uid,
            parentName: formData.name,
            parentUid: uid
          }).catch(() => {});

          await setDoc(
            doc(db, 'parents', uid),
            { children: arrayUnion(formData.linkedStudentId) },
            { merge: true }
          );

          console.debug('[CreateParent] linked parent', uid, 'to student', formData.linkedStudentId);
        } catch (e) {
          console.error('[CreateParent] failed linking student', formData.linkedStudentId, e);
        }
      }

      setSuccess(true);
      // Keep admin on admin panel; show success modal
    } catch (err: any) {
      console.error('[CreateParent] error', err);
      setError(err.message || 'Unable to create parent at this time. Please try again.');
    }
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
    setError('');
    setFormData(initialParentFormData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Create Parent Account</h1>
        <p className="text-slate-400">Add a new parent to the system with secure role-based access.</p>
      </div>

      <div className="max-w-3xl rounded-3xl border border-white/10 bg-slate-950/95 p-8 shadow-2xl shadow-slate-950/30">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3">{error}</p>}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  placeholder="Muhammad Khan"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  placeholder="parent@gmail.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  placeholder="+92-300-9876543"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  placeholder="Set a password"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  CNIC Number *
                </label>
                <input
                  type="text"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  placeholder="35202-1234567-8"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                placeholder="House 123, Street 5, Gulberg, Lahore"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Link to Student (optional)
              </label>
              <select
                name="linkedStudentId"
                value={formData.linkedStudentId}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.registrationNumber})
                  </option>
                ))}
              </select>
              {students.length === 0 && (
                <p className="text-xs text-slate-500 mt-2">No students found yet. You can create a parent account without a student link.</p>
              )}
            </div>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-500 py-3 text-white font-semibold shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Create Parent
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/parents')}
                className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-200 hover:bg-slate-800 transition py-3"
              >
                Cancel
              </button>
            </div>
          </form>

          {success && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
              <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/95 p-8 shadow-2xl shadow-slate-950/50">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">Parent created successfully.</h2>
                <p className="text-slate-400 mb-6">The parent account has been created and saved to the system.</p>
                <div className="flex justify-center">
                  <button
                    onClick={handleCloseSuccess}
                    className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-white font-semibold shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
