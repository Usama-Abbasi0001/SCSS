import { useEffect, useState } from 'react';
import { User, MapPin, AlertTriangle, Bell } from 'lucide-react';
import StatCard from '../../components/dashboard/StatCard';
import { useAuth } from '../../context/AuthContext';
import MapView from '../../components/map/MapView';
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { AlertDocument, ParentDocument, StudentDocument } from '../../types/firestore';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [parent, setParent] = useState<ParentDocument | null>(null);
  const [children, setChildren] = useState<StudentDocument[]>([]);
  const [alerts, setAlerts] = useState<AlertDocument[]>([]);

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
  }, [user?.id]);

  useEffect(() => {
    if (!parent?.id) {
      setChildren([]);
      return;
    }

    let cancelled = false;
    const childrenQuery = query(collection(db, 'students'), where('parentId', '==', parent.id));
    const unsubscribe = onSnapshot(childrenQuery, async (snapshot) => {
      const matched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StudentDocument));
      if (matched.length > 0) {
        setChildren(matched);
        return;
      }

      if (parent.linkedStudentId) {
        const childRef = doc(db, 'students', parent.linkedStudentId);
        const childSnap = await getDocs(query(collection(db, 'students'), where('uid', '==', parent.linkedStudentId)));
        if (!childSnap.empty) {
          if (cancelled) return;
          setChildren(childSnap.docs.map((d) => ({ id: d.id, ...d.data() } as StudentDocument)));
          return;
        }
        const directSnap = await getDoc(childRef);
        if (cancelled) return;
        if (directSnap.exists()) {
          setChildren([{ id: directSnap.id, ...directSnap.data() } as StudentDocument]);
        } else {
          setChildren([]);
        }
      } else {
        setChildren([]);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [parent?.id, parent?.linkedStudentId]);

  useEffect(() => {
    const studentIds = children.map((c) => c.uid || c.id);
    if (studentIds.length === 0) {
      setAlerts([]);
      return;
    }

    const alertsQuery = query(collection(db, 'alerts'), where('studentId', 'in', studentIds.slice(0, 10)));
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      setAlerts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AlertDocument)));
    });

    return unsubscribe;
  }, [children]);

  if (!parent) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Parent Dashboard</h1>
          <p className="text-slate-300 mt-2">No parent record found in Firestore for this account.</p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Parent Dashboard</h1>
          <p className="text-slate-300 mt-2">No linked student record found for this parent.</p>
        </div>
      </div>
    );
  }

  const child = children[0];
  const childAlerts = alerts;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Parent Dashboard</h1>
        <p className="text-slate-300 mt-2">Welcome back, {parent.name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Child Status"
          value={child.emergencyStatus === 'active' ? 'Emergency' : 'Safe'}
          icon={AlertTriangle}
          color={child.emergencyStatus === 'active' ? 'red' : 'green'}
        />
        <StatCard title="Total Alerts" value={childAlerts.length} icon={Bell} color="purple" />
        <StatCard title="Tracking Status" value="Active" icon={MapPin} color="blue" />
        <StatCard title="Child Info" value={child.name} icon={User} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-6">My Children</h2>
          <div className="mb-6 space-y-2">
            {children.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <span className="text-slate-100 font-medium">{item.name}</span>
                <span className="text-xs text-slate-400">{item.registrationNumber || 'No Reg #'}</span>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-semibold text-white mb-6">Child Information</h2>
          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-xl">
                {child.name.split(' ').map((n) => n[0]).join('')}
              </span>
            </div>
            <div>
              <p className="font-semibold text-slate-900">{child.name}</p>
              <p className="text-sm text-slate-700">{child.registrationNumber}</p>
            </div>
            <div className="ml-auto">
              <span
                className={`text-[11px] font-medium px-3 py-1 rounded-full ${
                  child.emergencyStatus === 'active'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {child.emergencyStatus || 'inactive'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Phone</span>
              <span className="font-medium text-slate-100">{child.phone}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Device ID</span>
              <span className="font-medium text-purple-600 font-mono text-sm">
                {child.deviceId || 'Not assigned'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Last Update</span>
              <span className="font-medium text-slate-100">{child.lastLocation?.timestamp || 'No update'}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-6">Live Location</h2>
          <MapView lat={child.lastLocation?.lat ?? 0} lng={child.lastLocation?.lng ?? 0} studentName={child.name} />
        </div>

        <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-6">Recent Alerts</h2>
          <div className="space-y-3">
            {childAlerts.length > 0 ? (
              childAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 p-4 border border-slate-800 rounded-xl hover:shadow-md transition-shadow"
                >
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      alert.type === 'emergency'
                        ? 'text-red-600'
                        : alert.type === 'warning'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-100">{alert.message}</p>
                    <p className="text-sm text-slate-400 mt-1">{alert.timestamp}</p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      alert.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {alert.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No recent alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
