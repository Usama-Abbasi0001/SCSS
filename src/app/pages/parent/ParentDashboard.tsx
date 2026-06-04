import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { AlertDocument, ParentDocument, StudentDocument } from '../../types/firestore';
import DashboardStats from '../../components/parent/DashboardStats';
import RecentActivity from '../../components/parent/RecentActivity';
import QuickActions from '../../components/parent/QuickActions';
import { AlertCircle } from 'lucide-react';

export default function ParentDashboard() {
  const { user, loading } = useAuth();

  // Data states
  const [parent, setParent] = useState<ParentDocument | null>(null);
  const [children, setChildren] = useState<StudentDocument[]>([]);
  const [alerts, setAlerts] = useState<AlertDocument[]>([]);
  const [userStatuses, setUserStatuses] = useState<Record<string, any>>({});
  const [devices, setDevices] = useState<Record<string, any>>({});

  // UI states
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch parent data
  useEffect(() => {
    if (!user?.id || loading) {
      return;
    }

    setDashboardLoading(true);

    const parentRef = doc(db, 'users', user.id);
    const unsubscribe = onSnapshot(
      parentRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setParent({ id: snapshot.id, ...snapshot.data() } as ParentDocument);
          setError(null);
        } else {
          setParent(null);
          setError('No parent record found. Please contact support.');
        }
        setDashboardLoading(false);
      },
      (err) => {
        console.error('[ParentDashboard] Error fetching parent:', err);
        setError('Failed to load parent data');
        setDashboardLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.id, loading]);

  // Fetch children data
  useEffect(() => {
    if (!parent?.id) {
      setChildren([]);
      return;
    }

    let cancelled = false;

    const childrenQuery = query(collection(db, 'students'), where('parentId', '==', parent.id));
    const unsubscribe = onSnapshot(
      childrenQuery,
      async (snapshot) => {
        const matched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StudentDocument));
        if (!cancelled) {
          setChildren(matched);
        }
      },
      (err) => {
        console.error('[ParentDashboard] Error fetching children:', err);
        if (!cancelled) {
          setError('Failed to load child data');
        }
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [parent?.id]);

  // Fetch alerts for all children
  useEffect(() => {
    const studentIds = children.map((c) => c.uid || c.id).filter(Boolean);
    if (studentIds.length === 0) {
      setAlerts([]);
      return;
    }

    const alertsQuery = query(
      collection(db, 'alerts'),
      where('studentId', 'in', studentIds.slice(0, 10))
    );

    const unsubscribe = onSnapshot(
      alertsQuery,
      (snapshot) => {
        setAlerts(
          snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as AlertDocument))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        );
      },
      (err) => {
        console.error('[ParentDashboard] Error fetching alerts:', err);
      }
    );

    return unsubscribe;
  }, [children]);

  // Fetch user status (online/offline) for all children
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'userStatus'),
      (snapshot) => {
        const statuses: Record<string, any> = {};
        snapshot.docs.forEach((doc) => {
          statuses[doc.id] = doc.data();
        });
        setUserStatuses(statuses);
      },
      (err) => {
        console.error('[ParentDashboard] Error fetching user statuses:', err);
      }
    );

    return unsubscribe;
  }, []);

  // Fetch device status
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'devices'),
      (snapshot) => {
        const devicesMap: Record<string, any> = {};
        snapshot.docs.forEach((doc) => {
          devicesMap[doc.id] = doc.data();
        });
        setDevices(devicesMap);
      },
      (err) => {
        console.error('[ParentDashboard] Error fetching devices:', err);
      }
    );

    return unsubscribe;
  }, []);

  if (loading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mb-4" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

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
  const childId = child.uid || child.id;
  const childIsOnline = childId ? userStatuses[childId]?.isOnline ?? false : false;
  const deviceStatus = child.deviceId && devices[child.deviceId] ? devices[child.deviceId].status === 'active' ? 'connected' : 'disconnected' : 'disconnected';
  const lastLocationUpdate = child.lastLocation?.timestamp ? new Date(child.lastLocation.timestamp).toLocaleString() : 'No data';

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Parent Dashboard</h1>
          <p className="text-slate-300 mt-2">Welcome back, {parent.name}!</p>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded-lg border border-red-800">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      <DashboardStats
        child={child}
        totalAlerts={alerts.length}
        childIsOnline={childIsOnline}
        deviceStatus={deviceStatus}
        lastLocationUpdate={lastLocationUpdate}
        emergencyActive={child.emergencyStatus === 'active'}
        loading={dashboardLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <RecentActivity child={child} alerts={alerts} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
