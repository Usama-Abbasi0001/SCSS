import { useEffect, useState } from 'react';
import { AlertTriangle, Bell } from 'lucide-react';
import AlertBadge from '../../components/dashboard/AlertBadge';
import { useAuth } from '../../context/AuthContext';
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { AlertDocument, StudentDocument } from '../../types/firestore';

export default function StudentAlerts() {
  const { user } = useAuth();
  const [, setStudent] = useState<StudentDocument | null>(null);
  const [studentAlerts, setStudentAlerts] = useState<AlertDocument[]>([]);

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

  useEffect(() => {
    if (!user?.id) {
      setStudentAlerts([]);
      return;
    }

    const alertsQuery = query(collection(db, 'alerts'), where('studentId', '==', user.id));
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      setStudentAlerts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AlertDocument)));
    });

    return unsubscribe;
  }, [user?.id]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Alert History</h1>
        <p className="text-gray-600 mt-2">View all your past alerts and notifications</p>
      </div>

      {studentAlerts.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-4">
            {studentAlerts.map((alert) => (
              <div key={alert.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        alert.type === 'emergency' ? 'bg-red-100' :
                        alert.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}
                    >
                      <AlertTriangle
                        className={`w-6 h-6 ${
                          alert.type === 'emergency' ? 'text-red-600' :
                          alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{alert.message}</h3>
                      <p className="text-sm text-gray-600 mt-1">{alert.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <AlertBadge type={alert.type}>{alert.type}</AlertBadge>
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        alert.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {alert.status}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Location at time of alert:</p>
                  <p className="font-mono text-sm text-gray-900">
                    {alert.location?.lat != null && alert.location?.lng != null
                      ? `${alert.location.lat.toFixed(6)}, ${alert.location.lng.toFixed(6)}`
                      : 'Location unavailable'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="text-center">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Alerts Yet</h2>
            <p className="text-gray-600">You don't have any alert history yet. Stay safe!</p>
          </div>
        </div>
      )}
    </div>
  );
}
