import { useEffect, useState } from 'react';
import { Phone, MapPin, Users, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { StudentDocument } from '../../types/firestore';

export default function StudentProfile() {
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentDocument | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setStudent(null);
      return;
    }

    const studentRef = doc(db, 'students', user.id);
    const unsubscribe = onSnapshot(studentRef, async (snapshot) => {
      if (snapshot.exists()) {
        setStudent({ id: snapshot.id, ...snapshot.data() } as StudentDocument);
      } else {
        const fallbackQuery = query(
          collection(db, 'students'),
          where('registrationNumber', '==', user.id)
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        if (fallbackSnapshot.docs.length > 0) {
          const docData = fallbackSnapshot.docs[0];
          setStudent({ id: docData.id, ...docData.data() } as StudentDocument);
        } else {
          setStudent(null);
        }
      }
    });

    return unsubscribe;
  }, [user?.id]);

  if (!student) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-slate-300 mt-2">No student profile found in Firestore for this account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <p className="text-slate-300 mt-2">View your personal information</p>
      </div>

      <div className="max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 h-32" />
          <div className="px-8 pb-8">
            <div className="flex items-end gap-6 -mt-16 mb-6">
              <div className="w-32 h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
                <span className="text-green-600 font-bold text-4xl">
                  {student.name.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <div className="pb-4">
                <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                <p className="text-gray-600">{student.registrationNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-medium text-gray-900">{student.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">{student.address}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <Users className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Parent Name</p>
                    <p className="font-medium text-gray-900">{student.parentName || 'Not linked'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <Shield className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Assigned Device</p>
                    <p className="font-medium text-purple-600 font-mono">{student.deviceId || 'Not assigned'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="font-semibold text-green-900 mb-2">Safety Information</h3>
          <p className="text-sm text-green-700">
            Your safety device is active and monitoring your location. In case of emergency,
            press the emergency button on your device to alert campus security and your parent.
          </p>
        </div>
      </div>
    </div>
  );
}
