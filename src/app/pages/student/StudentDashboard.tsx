import { useEffect, useState } from 'react';
import { User, MapPin, AlertTriangle, Bell } from 'lucide-react';
import StatCard from '../../components/dashboard/StatCard';
import { useAuth } from '../../context/AuthContext';
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { AlertDocument, StudentDocument } from '../../types/firestore';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentDocument | null>(null);
  const [alerts, setAlerts] = useState<AlertDocument[]>([]);

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
      setAlerts([]);
      return;
    }

    const alertsQuery = query(collection(db, 'alerts'), where('studentId', '==', user.id));
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      setAlerts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AlertDocument)));
    });

    return unsubscribe;
  }, [user?.id]);

  if (!student) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">No student profile found in Firestore for this account.</p>
        </div>
      </div>
    );
  }

  const studentAlerts = alerts;
  const location = student.lastLocation ?? { lat: 0, lng: 0, timestamp: 'No location available' };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {student.name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Emergency Status"
          value={student.emergencyStatus || 'inactive'}
          icon={AlertTriangle}
          color={student.emergencyStatus === 'active' ? 'red' : 'green'}
        />
        <StatCard
          title="Total Alerts"
          value={studentAlerts.length}
          icon={Bell}
          color="blue"
        />
        <StatCard
          title="Device Status"
          value={student.deviceId ? 'Active' : 'Not Assigned'}
          icon={MapPin}
          color={student.deviceId ? 'green' : 'blue'}
        />
        <StatCard
          title="Parent Contact"
          value={student.parentName || 'Not linked'}
          icon={User}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-xl">
                  {student.name.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{student.name}</p>
                <p className="text-sm text-gray-600">{student.registrationNumber}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Phone</span>
                <span className="font-medium text-gray-900">{student.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Parent</span>
                <span className="font-medium text-gray-900">{student.parentName || 'Not linked'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Device ID</span>
                <span className="font-medium text-purple-600 font-mono text-sm">
                  {student.deviceId || 'Not assigned'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Last Known Location</h2>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-green-600 p-3 rounded-full">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Current Position</p>
                <p className="text-sm text-gray-600 mt-1">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-gray-500">Last Updated</p>
              <p className="font-medium text-gray-900">{location.timestamp}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-3">
            {studentAlerts.length > 0 ? (
              studentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      alert.type === 'emergency' ? 'text-red-600' :
                      alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{alert.message}</p>
                    <p className="text-sm text-gray-600 mt-1">{alert.timestamp}</p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      alert.status === 'active'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {alert.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
