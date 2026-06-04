import { User, MapPin, AlertTriangle, Smartphone, Clock, AlertCircle } from 'lucide-react';
import StatusCard from './StatusCard';
import { StudentDocument } from '../../types/firestore';

interface DashboardStatsProps {
  child: StudentDocument | null;
  totalAlerts: number;
  childIsOnline: boolean;
  deviceStatus: 'connected' | 'disconnected';
  lastLocationUpdate: string;
  emergencyActive: boolean;
  loading?: boolean;
}

export default function DashboardStats({
  child,
  totalAlerts,
  childIsOnline,
  deviceStatus,
  lastLocationUpdate,
  emergencyActive,
  loading = false
}: DashboardStatsProps) {
  if (loading || !child) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-lg animate-pulse"
          >
            <div className="h-4 bg-slate-800 rounded w-1/2 mb-4" />
            <div className="h-6 bg-slate-800 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  const hasLocationData = child?.lastLocation?.timestamp;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatusCard
        title="Child Status"
        value={childIsOnline ? 'Online' : 'Offline'}
        icon={User}
        status={childIsOnline ? 'online' : 'offline'}
        subtitle={child.name}
      />

      <StatusCard
        title="Current Location"
        value={hasLocationData ? 'Available' : 'Unavailable'}
        icon={MapPin}
        status={hasLocationData ? 'available' : 'unavailable'}
        subtitle={hasLocationData ? `${child.lastLocation?.lat.toFixed(4)}, ${child.lastLocation?.lng.toFixed(4)}` : 'Waiting for data'}
      />

      <StatusCard
        title="Total Alerts"
        value={totalAlerts}
        icon={AlertCircle}
        status="active"
        subtitle={`${totalAlerts} alert${totalAlerts !== 1 ? 's' : ''} received`}
      />

      <StatusCard
        title="Last Location Update"
        value={lastLocationUpdate}
        icon={Clock}
        status="active"
        subtitle={hasLocationData ? child.lastLocation?.timestamp : 'No updates'}
      />

      <StatusCard
        title="Device Status"
        value={deviceStatus === 'connected' ? 'Connected' : 'Disconnected'}
        icon={Smartphone}
        status={deviceStatus}
        subtitle={child.deviceId || 'No device'}
      />

      <StatusCard
        title="Emergency Status"
        value={emergencyActive ? 'Emergency' : 'Normal'}
        icon={AlertTriangle}
        status={emergencyActive ? 'emergency' : 'normal'}
        subtitle={emergencyActive ? 'URGENT: Alert sent' : 'Safe'}
      />
    </div>
  );
}
