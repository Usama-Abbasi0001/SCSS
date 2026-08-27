import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../../services/safetyService';
import { NotificationDocument } from '../../types/firestore';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';

export default function ParentNotifications() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDocument[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    if (!user?.id && !user?.uid) {
      setNotifications([]);
      setLoadingList(false);
      return;
    }

    const recipientId = user.uid || user.id;
    setLoadingList(true);

    const unsubscribe = subscribeNotifications(recipientId, (notifs) => {
      setNotifications(notifs);
      setLoadingList(false);
    });

    return () => unsubscribe();
  }, [user?.id, user?.uid]);

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id);
  };

  const handleMarkAllRead = async () => {
    if (user?.uid || user?.id) {
      await markAllNotificationsAsRead(user.uid || user.id);
    }
  };

  if (loading || loadingList) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/90 p-10">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-fuchsia-500" />
          <p className="mt-4 text-sm text-slate-400">Loading safety notifications…</p>
        </div>
      </div>
    );
  }

  const unreadList = notifications.filter((n) => !n.read);
  const readList = notifications.filter((n) => n.read);

  const getIcon = (type: string) => {
    switch (type) {
      case 'sos':
      case 'emergency':
        return <AlertTriangle className="h-5 w-5 text-rose-400" />;
      case 'resolved':
        return <ShieldCheck className="h-5 w-5 text-emerald-400" />;
      case 'location':
        return <MapPin className="h-5 w-5 text-sky-400" />;
      default:
        return <Info className="h-5 w-5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <div>
          <h1 className="text-3xl font-semibold text-white">Notifications</h1>
          <p className="mt-1 text-slate-400">Real-time alerts, safety events, and emergency updates</p>
        </div>

        {unreadList.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 text-xs font-semibold text-white transition self-start sm:self-auto shadow-lg shadow-fuchsia-600/20"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All as Read ({unreadList.length})
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total Notifications</p>
            <Bell className="h-5 w-5 text-fuchsia-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{notifications.length}</p>
        </div>

        <div className="rounded-3xl border border-rose-500/20 bg-rose-950/20 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-rose-300 font-medium">Unread</p>
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-rose-200">{unreadList.length}</p>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-emerald-300 font-medium">Read & Archived</p>
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-emerald-200">{readList.length}</p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/10">
        <h2 className="text-xl font-semibold text-white mb-6">Recent Notifications Feed</h2>

        {notifications.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-slate-800/80 bg-slate-900/30">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-slate-500">
              <Bell className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-white">No Notifications Yet</h3>
            <p className="text-xs text-slate-400 mt-1">You will receive instant alerts when safety events occur.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-5 rounded-2xl border transition-all ${
                  notif.read
                    ? 'border-slate-800/80 bg-slate-900/40 text-slate-300'
                    : 'border-fuchsia-500/30 bg-fuchsia-950/10 shadow-lg shadow-fuchsia-950/10 text-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex-shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-base">{notif.title}</h4>
                        {!notif.read && (
                          <span className="h-2 w-2 rounded-full bg-fuchsia-500 animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm text-slate-300 mt-1">{notif.message}</p>
                      <p className="text-xs text-slate-500 mt-2">{notif.timestamp}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                    {notif.googleMapsUrl && (
                      <a
                        href={notif.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-semibold p-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Map
                      </a>
                    )}

                    {!notif.read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 transition"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
