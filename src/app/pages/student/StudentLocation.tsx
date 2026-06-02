import { useEffect, useState } from 'react';
import MapView from '../../components/map/MapView';
import { useAuth } from '../../context/AuthContext';
import { Clock, Navigation } from 'lucide-react';
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { StudentDocument } from '../../types/firestore';

export default function StudentLocation() {
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
          <h1 className="text-3xl font-bold text-gray-900">My Location</h1>
          <p className="text-gray-600 mt-2">No live student location found for this account.</p>
        </div>
      </div>
    );
  }

  const location = student.lastLocation ?? { lat: 0, lng: 0, timestamp: 'No location available' };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Location</h1>
        <p className="text-gray-600 mt-2">Real-time GPS tracking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <MapView lat={location.lat} lng={location.lng} studentName={student.name} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-green-600" />
              Current Position
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Latitude</p>
                <p className="font-mono font-medium text-gray-900">{location.lat.toFixed(6)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Longitude</p>
                <p className="font-mono font-medium text-gray-900">{location.lng.toFixed(6)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Last Updated
            </h3>
            <p className="text-gray-700">{location.timestamp}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>GPS Active</span>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h3 className="font-semibold text-green-900 mb-2">Tracking Active</h3>
            <p className="text-sm text-green-700">
              Your device is transmitting location data every 30 seconds. This helps
              keep you safe and allows quick response in emergencies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
