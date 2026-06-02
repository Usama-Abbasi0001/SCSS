import { useEffect, useState } from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import AlertBadge from '../../components/dashboard/AlertBadge';
import { useAuth } from '../../context/AuthContext';
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { AlertDocument, ParentDocument } from '../../types/firestore';

export default function ParentAlerts() {
  const { user } = useAuth();
  const [parent, setParent] = useState<ParentDocument | null>(null);
  const [childAlerts, setChildAlerts] = useState<AlertDocument[]>([]);

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
    if (!parent?.linkedStudentId) {
      setChildAlerts([]);
      return;
    }

    const alertsQuery = query(collection(db, 'alerts'), where('studentId', '==', parent.linkedStudentId));
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      setChildAlerts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AlertDocument)));
    });

    return unsubscribe;
  }, [parent?.linkedStudentId]);

  const activeAlerts = childAlerts.filter((a) => a.status === 'active');

  if (!parent) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Emergency Alerts</h1>
          <p className="text-gray-600 mt-2">No parent record found for this account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Emergency Alerts</h1>
        <p className="text-gray-600 mt-2">Monitor your child's safety alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-red-900">Active Alerts</h3>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{activeAlerts.length}</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-purple-900">Total Alerts</h3>
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-600">{childAlerts.length}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-green-900">Resolved</h3>
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{childAlerts.filter((a) => a.status === 'resolved').length}</p>
        </div>
      </div>

      {childAlerts.length > 0 ? (
        <div className="space-y-6">
          {activeAlerts.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Active Emergencies
              </h2>
              <div className="space-y-4">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="border-2 border-red-200 bg-red-50 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-red-600 p-3 rounded-xl">
                          <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{alert.message}</h3>
                          <p className="text-sm text-gray-600 mt-1">{alert.timestamp}</p>
                        </div>
                      </div>
                      <AlertBadge type={alert.type}>{alert.type}</AlertBadge>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Location:</p>
                      <p className="font-mono text-sm text-gray-900">
                        {alert.location?.lat != null && alert.location?.lng != null
                          ? `${alert.location.lat.toFixed(6)}, ${alert.location.lng.toFixed(6)}`
                          : 'Location unavailable'}
                      </p>
                    </div>

                    <div className="mt-4">
                      <button className="w-full bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition-colors">
                        View Live Location
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">All Alerts</h2>
            <div className="space-y-4">
              {childAlerts.map((alert) => (
                <div key={alert.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
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
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{alert.message}</h3>
                        <p className="text-sm text-gray-600 mt-1">{alert.timestamp}</p>
                        <p className="text-xs text-gray-500 mt-2 font-mono">
                          {alert.location?.lat != null && alert.location?.lng != null
                            ? `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}`
                            : 'Location unavailable'}
                        </p>
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
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">All Clear!</h2>
            <p className="text-gray-600">No alerts from your child. Everything is safe.</p>
          </div>
        </div>
      )}
    </div>
  );
}
