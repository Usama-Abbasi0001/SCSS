import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle } from 'lucide-react';
import {
  arrayUnion,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FIREBASE_API_KEY } from '../../../config/firebase';
import { createAuthUserWithoutLogin } from '../../utils/adminAuth';

function buildStudentAuthEmail(deviceId: string) {
  const normalized = deviceId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return `student+${normalized}@smartcampus.local`;
}

export default function CreateStudent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    phone: '',
    address: '',
    parentId: '',
    parentName: '',
    deviceId: '',
    email: '',
    password: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Parents data is loaded but not used in this component
    // Kept for potential future use
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.registrationNumber || !formData.phone || !formData.address || !formData.deviceId || !formData.password) {
      setError('Please complete all required fields and assign a device ID plus password.');
      return;
    }

    if (!formData.parentName) {
      setError('Please enter a parent name.');
      return;
    }

    try {
      const authEmail = formData.email.trim() || buildStudentAuthEmail(formData.deviceId);

      // Create auth user via REST to avoid altering the current client auth state
      const created = await createAuthUserWithoutLogin(FIREBASE_API_KEY, authEmail, formData.password);
      const uid = created.localId as string;

      const studentProfile = {
        uid,
        name: formData.name,
        email: authEmail,
        role: 'student' as const,
        status: 'active',
        deviceId: formData.deviceId,
        // linkedStudentId for a student should reference their own auth UID
        linkedStudentId: uid,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', uid), studentProfile);

      const studentData = {
        uid,
        name: formData.name,
        registrationNumber: formData.registrationNumber,
        phone: formData.phone,
        address: formData.address,
        parentId: formData.parentId || '',
        parentName: formData.parentName,
        deviceId: formData.deviceId,
        email: authEmail,
        emergencyStatus: 'inactive',
        createdAt: new Date().toISOString()
      };

      // Save student document with auth UID as document ID to make linking by UID straightforward
      const studentDocRef = doc(db, 'students', uid);
      await setDoc(studentDocRef, studentData);

      await setDoc(
        doc(db, 'userStatus', uid),
        { status: 'active', lastActive: serverTimestamp(), role: 'student' },
        { merge: true }
      );

      if (formData.parentId) {
        const parentRef = doc(db, 'parents', formData.parentId);
        await updateDoc(parentRef, {
          linkedStudentId: uid,
          children: arrayUnion(uid)
        }).catch(() => {
          /* ignore update errors */
        });
      }

      setSuccess(true);
      // Do not redirect or sign in as the created user. Keep admin logged in and stay on admin panel.
    } catch (err: any) {
      console.error('[CreateStudent] error', err);
      setError(err.message || 'Unable to create student at this time. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Create Student Account</h1>
        <p className="text-slate-400 mt-2">Add a new student to the system</p>
      </div>

      <div className="max-w-2xl bg-slate-950/95 rounded-3xl border border-white/10 shadow-2xl shadow-slate-950/30 p-8">
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
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Ahmed Khan"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Registration Number *
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="REG-2024-001"
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
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="+92-300-1234567"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Parent Name *
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Parent Name"
                  required
                />
              </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Set a password"
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
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="House 123, Street 5, Gulberg, Lahore"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Device ID *
            </label>
            <input
              type="text"
              name="deviceId"
              value={formData.deviceId}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="ESP32-001"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Student logs in using Device ID + password.</p>
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-white font-semibold shadow-lg shadow-cyan-500/15 transition hover:brightness-110 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Create Student
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/students')}
                className="px-6 py-3 rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-200 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
            </div>
          </div>
          </form>

          {success && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
              <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/95 p-8 shadow-2xl shadow-slate-950/50">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">Student created successfully.</h2>
                <p className="text-slate-400 mb-6">The student account has been created and saved to the system.</p>
                <div className="flex justify-center">
                  <button
                    onClick={() => setSuccess(false)}
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

