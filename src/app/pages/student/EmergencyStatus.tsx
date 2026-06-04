import { useEffect, useState } from 'react';
import { AlertTriangle, Phone, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { StudentDocument } from '../../types/firestore';

export default function EmergencyStatus() {
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
          <h1 className="text-3xl font-bold text-white">Emergency Status</h1>
          <p className="text-slate-300 mt-2">No student record found for this account.</p>
        </div>
      </div>
    );
  }

  const isEmergency = student.emergencyStatus === 'active';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Emergency Status</h1>
        <p className="text-slate-300 mt-2">View your current safety status</p>
      </div>

      <div className="max-w-2xl">
        <div
          className={`rounded-2xl p-8 border-2 ${
            isEmergency ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'
          }`}
        >
          <div className="text-center">
            <div
              className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
                isEmergency ? 'bg-red-600 animate-pulse' : 'bg-green-600'
              }`}
            >
              {isEmergency ? (
                <AlertTriangle className="w-12 h-12 text-white" />
              ) : (
                <Shield className="w-12 h-12 text-white" />
              )}
            </div>

            <h2
              className={`text-3xl font-bold mb-2 ${
                isEmergency ? 'text-red-900' : 'text-green-900'
              }`}
            >
              {isEmergency ? 'Emergency Active!' : 'Status: Safe'}
            </h2>
            <p
              className={`text-lg mb-8 ${
                isEmergency ? 'text-red-700' : 'text-green-700'
              }`}
            >
              {isEmergency
                ? 'Emergency alert has been sent to campus security and your parent'
                : 'No active emergencies. You are safe.'}
            </p>

            {isEmergency && (
              <div className="bg-white rounded-xl p-6 mb-6">
                <p className="font-semibold text-gray-900 mb-4">Help is on the way</p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <p className="text-sm text-gray-700">Campus security has been notified</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <p className="text-sm text-gray-700">Your parent has been alerted</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <p className="text-sm text-gray-700">Your location is being tracked</p>
                  </div>
                </div>
              </div>
            )}

            <button
              className={`w-full py-4 rounded-xl font-semibold transition-colors ${
                isEmergency
                  ? 'bg-gray-800 text-white hover:bg-gray-900'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isEmergency ? 'Cancel Emergency Alert' : 'Trigger Emergency Alert'}
            </button>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-600" />
            Emergency Contacts
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Campus Security</span>
              <span className="font-medium text-blue-600">+92-300-0000000</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Parent: {student.parentName || 'Not linked'}</span>
              <span className="font-medium text-blue-600">{student.phone}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to use Emergency Alert</h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li>• Press the emergency button on your device or click the button above</li>
            <li>• Your location will be instantly shared with security and your parent</li>
            <li>• Stay calm and wait for help to arrive</li>
            <li>• Only use for real emergencies</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
