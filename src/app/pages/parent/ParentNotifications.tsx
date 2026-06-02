import { useEffect, useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { AlertDocument, ParentDocument } from '../../types/firestore';

interface Notification {
  id: string;
  type: 'alert' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function ParentNotifications() {
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

  const notifications: Notification[] = [
    ...childAlerts.map((alert) => ({
      id: alert.id,
      type: 'alert' as const,
      title: 'Emergency Alert',
      message: alert.message,
      timestamp: alert.timestamp,
      read: alert.status === 'resolved'
    })),
    {
      id: 'n1',
      type: 'info',
      title: 'Device Status',
      message: 'Safety device battery at 85%',
      timestamp: '2026-05-31 12:00:00',
      read: true
    },
    {
      id: 'n2',
      type: 'success',
      title: 'Location Update',
      message: 'Your child has arrived at campus',
      timestamp: '2026-05-31 08:30:00',
      read: true
    }
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'bg-red-50 border-red-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (!parent) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">No parent record found for this account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-2">Stay updated with your child's safety status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-purple-900">Total</h3>
            <Bell className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-600">{notifications.length}</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-red-900">Unread</h3>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{unreadCount}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-green-900">Read</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{notifications.length - unreadCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">All Notifications</h2>
          {unreadCount > 0 && (
            <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              Mark all as read
            </button>
          )}
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-xl p-5 transition-all ${
                notification.read
                  ? 'bg-white border-gray-200'
                  : `${getBgColor(notification.type)} border-2`
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 p-2 rounded-lg ${
                    notification.type === 'alert' ? 'bg-red-100' :
                    notification.type === 'success' ? 'bg-green-100' : 'bg-blue-100'
                  }`}
                >
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    {!notification.read && <span className="flex-shrink-0 w-2 h-2 bg-purple-600 rounded-full" />}
                  </div>
                  <p className="text-gray-700 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500">{notification.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
