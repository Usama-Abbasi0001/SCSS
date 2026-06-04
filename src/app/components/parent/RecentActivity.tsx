import { Clock, AlertTriangle, MapPin, LogIn, AlertCircle, Activity } from 'lucide-react';
import { AlertDocument, StudentDocument } from '../../types/firestore';

interface ActivityItem {
  id: string;
  type: 'login' | 'location' | 'alert' | 'emergency';
  title: string;
  description: string;
  timestamp: string;
  icon: typeof AlertTriangle;
  color: 'emerald' | 'blue' | 'yellow' | 'red' | 'purple';
}

interface RecentActivityProps {
  child: StudentDocument | null;
  alerts: AlertDocument[];
  lastLogin?: string;
  loading?: boolean;
}

export default function RecentActivity({ child, alerts, lastLogin, loading = false }: RecentActivityProps) {
  const activities: ActivityItem[] = [];

  if (lastLogin) {
    activities.push({
      id: 'login',
      type: 'login',
      title: 'Last Login',
      description: `${child?.name} logged in`,
      timestamp: lastLogin,
      icon: LogIn,
      color: 'emerald'
    });
  }

  if (child?.lastLocation?.timestamp) {
    activities.push({
      id: 'location',
      type: 'location',
      title: 'Location Update',
      description: `GPS location: ${child.lastLocation.lat.toFixed(4)}, ${child.lastLocation.lng.toFixed(4)}`,
      timestamp: child.lastLocation.timestamp,
      icon: MapPin,
      color: 'blue'
    });
  }

  alerts.slice(0, 5).forEach((alert) => {
    if (alert.type === 'emergency') {
      activities.push({
        id: alert.id,
        type: 'emergency',
        title: 'Emergency Alert',
        description: alert.message || 'Emergency alert triggered',
        timestamp: alert.timestamp,
        icon: AlertTriangle,
        color: 'red'
      });
    } else {
      activities.push({
        id: alert.id,
        type: 'alert',
        title: 'Alert Received',
        description: alert.message || `${alert.type} alert`,
        timestamp: alert.timestamp,
        icon: AlertCircle,
        color: alert.type === 'warning' ? 'yellow' : 'purple'
      });
    }
  });

  // Sort by timestamp (newest first) - simplified sort assuming ISO format
  activities.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  const colorClasses = {
    emerald: 'from-emerald-600 to-emerald-600',
    blue: 'from-blue-600 to-blue-600',
    yellow: 'from-yellow-600 to-yellow-600',
    red: 'from-red-600 to-red-600',
    purple: 'from-purple-600 to-purple-600'
  };

  const textColorClasses = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    purple: 'text-purple-400'
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
        <div className="h-6 bg-slate-800 rounded w-1/4 mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-800/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Recent Activity
        </h2>
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
          <p className="text-slate-400">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Activity className="w-6 h-6" />
        Recent Activity
      </h2>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const ActivityIcon = activity.icon;
          return (
            <div key={activity.id} className="relative">
              {/* Timeline connector */}
              {index !== activities.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-slate-700 to-transparent" />
              )}

              {/* Activity item */}
              <div className="flex gap-4">
                <div
                  className={`relative flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${colorClasses[activity.color]} flex items-center justify-center ring-4 ring-slate-900 z-10`}
                >
                  <ActivityIcon className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 pt-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`font-semibold ${textColorClasses[activity.color]}`}>{activity.title}</p>
                      <p className="text-sm text-slate-400 mt-0.5">{activity.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {activity.timestamp}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
