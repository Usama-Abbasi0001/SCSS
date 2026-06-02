import { useEffect, useState } from 'react';
import MapView from '../../components/map/MapView';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Clock, Navigation, Activity } from 'lucide-react';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { ParentDocument, StudentDocument } from '../../types/firestore';

export default function LiveTracking() {
  const { user } = useAuth();
  const [parent, setParent] = useState<ParentDocument | null>(null);
  const [child, setChild] = useState<StudentDocument | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setParent(null);
      return;
    }

    const parentRef = doc(db, 'parents', user.id);
    const unsubscribe = onSnapshot(parentRef, async (snapshot) => {
      if (snapshot.exists()) {
        setParent({ id: snapshot.id, ...snapshot.data() } as ParentDocument);
      } else {
        const fallbackQuery = query(collection(db, 'parents'), where('uid', '==', user.id));
        const fallbackSnapshot = await getDocs(fallbackQuery);
        if (fallbackSnapshot.docs.length > 0) {
          const docData = fallbackSnapshot.docs[0];
          setParent({ id: docData.id, ...docData.data() } as ParentDocument);
        } else {
          setParent(null);
        }
      }
    });

    return unsubscribe;
  }, [user?.id, user?.name]);

  useEffect(() => {
    if (!parent?.id) {
      setChild(null);
      return;
    }

    const childrenQuery = query(collection(db, 'students'), where('parentId', '==', parent.id));
    const unsubscribe = onSnapshot(childrenQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const primary = snapshot.docs[0];
        setChild({ id: primary.id, ...primary.data() } as StudentDocument);
        return;
      }

      if (!parent.linkedStudentId) {
        setChild(null);
        return;
      }

      const childRef = doc(db, 'students', parent.linkedStudentId);
      const childSnapshot = await getDocs(query(collection(db, 'students'), where('uid', '==', parent.linkedStudentId)));
      if (!childSnapshot.empty) {
        const primary = childSnapshot.docs[0];
        setChild({ id: primary.id, ...primary.data() } as StudentDocument);
        return;
      }

      const directChild = await getDoc(childRef);
      if (directChild.exists()) {
        setChild({ id: directChild.id, ...directChild.data() } as StudentDocument);
        return;
      }

      setChild(null);
    });

    return unsubscribe;
  }, [parent?.id, parent?.linkedStudentId]);

  if (!parent) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Live Tracking</h1>
          <p className="text-slate-300 mt-2">No parent data found for this account.</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Live Tracking</h1>
          <p className="text-slate-300 mt-2">No linked student found for this parent.</p>
        </div>
      </div>
    );
  }

  const location = child.lastLocation ?? { lat: 0, lng: 0, timestamp: 'No location available' };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Live Tracking</h1>
        <p className="text-slate-300 mt-2">Real-time location of {child.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Current Location</h2>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Live</span>
              </div>
            </div>
            <MapView lat={location.lat} lng={location.lng} studentName={child.name} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-purple-600" />
              GPS Coordinates
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Latitude</p>
                <p className="font-mono font-medium text-slate-100">{location.lat.toFixed(6)}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Longitude</p>
                <p className="font-mono font-medium text-slate-100">{location.lng.toFixed(6)}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Last Updated
            </h3>
            <p className="text-slate-200 mb-4">{location.timestamp}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-slate-200">Device Online</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-purple-600" />
                <span className="text-slate-200">GPS Signal Strong</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800">
            <h3 className="font-semibold text-white mb-4">Device Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Device ID</span>
                <span className="font-mono text-sm text-purple-600">{child.deviceId || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Battery</span>
                <span className="text-sm text-green-600 font-medium">85%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Status</span>
                <span className={`text-[11px] font-medium ${child.emergencyStatus === 'active' ? 'text-red-400' : 'text-green-400'}`}>
                  {child.emergencyStatus === 'active' ? 'Emergency' : 'Normal'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
            <h3 className="font-semibold text-purple-900 mb-2">Auto-Refresh</h3>
            <p className="text-sm text-purple-700">
              Location updates automatically every 30 seconds to provide real-time tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
