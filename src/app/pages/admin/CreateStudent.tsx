import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { UserPlus, CheckCircle } from 'lucide-react';
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FIREBASE_API_KEY } from '../../../config/firebase';
import { createAuthUserWithoutLogin } from '../../utils/adminAuth';
import { ParentDocument } from '../../types/firestore';

function buildStudentAuthEmail(deviceId: string) {
  const normalized = deviceId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return `student+${normalized}@smartcampus.local`;
}

const initialForm = {
  name: '',
  registrationNumber: '',
  phone: '',
  address: '',
  parentId: '',
  parentName: '',
  deviceId: '',
  email: '',
  password: ''
};

export default function CreateStudent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [parents, setParents] = useState<ParentDocument[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadParents = async () => {
      try {
        const parentSnap = await getDocs(collection(db, 'parents'));
        setParents(parentSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ParentDocument));
      } catch (err) {
        console.error('[CreateStudent] loading parents error', err);
      }
    };

    loadParents();
  }, []);

  const handleParentSelect = (parentId: string) => {
    const selected = parents.find((p) => p.id === parentId || p.uid === parentId);
    setFormData((prev) => ({
      ...prev,
      parentId,
      parentName: selected?.parentName || selected?.name || prev.parentName
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.registrationNumber.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.deviceId.trim() || !formData.password) {
      setError('Please complete all required fields (Name, Registration #, Phone, Address, Device ID, Password).');
      return;
    }

    try {
      setCreating(true);
      const authEmail = formData.email.trim() || buildStudentAuthEmail(formData.deviceId);

      // Create Firebase Auth user via REST (avoids logging out current admin session)
      const created = await createAuthUserWithoutLogin(FIREBASE_API_KEY, authEmail, formData.password);
      const uid = created.localId as string;

      const studentProfile = {
        uid,
        name: formData.name.trim(),
        email: authEmail,
        role: 'student' as const,
        status: 'active',
        deviceId: formData.deviceId.trim(),
        linkedStudentId: uid,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', uid), studentProfile);

      const studentData = {
        uid,
        studentId: uid,
        name: formData.name.trim(),
        registrationNumber: formData.registrationNumber.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        parentId: formData.parentId || '',
        parentUid: formData.parentId || '',
        parentName: formData.parentName.trim() || 'Parent',
        deviceId: formData.deviceId.trim(),
        email: authEmail,
        emergencyStatus: 'inactive',
        createdAt: new Date().toISOString(),
        lastLocation: {
          lat: 24.8607,
          lng: 67.0011,
          timestamp: new Date().toLocaleString()
        }
      };

      const studentDocRef = doc(db, 'students', uid);
      await setDoc(studentDocRef, studentData);

      // Assign device in 'devices' collection
      await setDoc(
        doc(db, 'devices', formData.deviceId.trim()),
        {
          name: `Campus Tracker ${formData.deviceId.trim()}`,
          status: 'active',
          assignedTo: uid
        },
        { merge: true }
      );

      // Set user presence in 'userStatus'
      await setDoc(
        doc(db, 'userStatus', uid),
        { status: 'active', isOnline: true, lastActive: serverTimestamp(), role: 'student' },
        { merge: true }
      );

      // Initialize location record
      await setDoc(
        doc(db, 'locations', uid),
        {
          studentId: uid,
          studentName: formData.name.trim(),
          registrationNumber: formData.registrationNumber.trim(),
          latitude: 24.8607,
          longitude: 67.0011,
          googleMapsUrl: 'https://www.google.com/maps?q=24.8607,67.0011',
          timestamp: new Date().toLocaleString(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      // Link to selected parent
      if (formData.parentId) {
        const parentRef = doc(db, 'parents', formData.parentId);
        const parentSnapshot = await getDoc(parentRef);
        const parentUid = parentSnapshot.exists() ? (parentSnapshot.data() as any).uid || formData.parentId : formData.parentId;

        await updateDoc(parentRef, {
          linkedStudentId: uid,
          studentId: uid,
          studentName: formData.name.trim(),
          children: arrayUnion(uid)
        }).catch(() => {});

        await updateDoc(doc(db, 'users', parentUid), {
          linkedStudentId: uid
        }).catch(() => {});

        await updateDoc(studentDocRef, {
          parentUid,
          parentId: formData.parentId,
          parentName: formData.parentName.trim()
        }).catch(() => {});
      }

      setSuccess(true);
      setFormData(initialForm); // Reset form for next student creation
    } catch (err: any) {
      console.error('[CreateStudent] error', err);
      setError(err.message || 'Unable to create student. Please try again.');
    } finally {
      setCreating(false);
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
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Register New Student</h1>
        <p className="text-slate-400">Add a new student, assign an IoT tracking device, and link to their parent account.</p>
      </div>

      <div className="max-w-3xl rounded-3xl border border-white/10 bg-slate-950/95 p-8 shadow-2xl shadow-slate-950/30">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Student Name *
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
                placeholder="REG-2026-001"
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
                Link to Registered Parent
              </label>
              <select
                name="parentId"
                value={formData.parentId}
                onChange={(e) => handleParentSelect(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="">Select a registered parent (optional)</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.parentName || p.name} ({p.phone || p.email})
                  </option>
                ))}
              </select>
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
                placeholder="Amir Khan"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Assigned Device ID (Hardware Beacon) *
              </label>
              <input
                type="text"
                name="deviceId"
                value={formData.deviceId}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                placeholder="ESP32-001"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Student can log in using Device ID or Email.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Login Email (optional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="student@smartcampus.local"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Account Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 pr-12 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Set account password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Campus Residence / Address *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Hostel Block A, Main Campus"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3.5 text-white font-semibold shadow-lg shadow-cyan-500/20 transition hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserPlus className="w-5 h-5" />
              {creating ? 'Creating Student Account…' : 'Register Student'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/students')}
              className="px-6 py-3.5 rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-200 hover:bg-slate-800 transition"
            >
              View Students List
            </button>
          </div>
        </form>

        {/* Success Modal */}
        {success && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/95 p-8 shadow-2xl text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">Student Registered!</h2>
              <p className="text-slate-400 mb-6">
                The student account, credentials, and IoT tracker link have been saved to Firestore. You can now register another student or return to the list.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setSuccess(false)}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-white font-semibold shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
                >
                  Create Another Student
                </button>
                <button
                  onClick={() => navigate('/admin/students')}
                  className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 text-slate-200 hover:bg-slate-800 transition text-sm"
                >
                  View All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
