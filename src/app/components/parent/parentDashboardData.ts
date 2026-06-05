import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Battery, CheckCircle, MapPin, ShieldCheck, Users } from 'lucide-react';

export interface DashboardStat {
  title: string;
  value: string;
  label: string;
  icon: LucideIcon;
  color: 'emerald' | 'sky' | 'rose' | 'amber' | 'violet' | 'green' | 'red';
}

export interface ChildProfile {
  id: string;
  name: string;
  grade: string;
  status: 'Safe' | 'Attention' | 'Emergency';
  location: string;
  lastUpdate: string;
  battery: number;
  alertsToday: number;
}

export interface AnalyticsItem {
  title: string;
  value: string;
  trend: string;
  icon: typeof ShieldCheck;
  color: 'green' | 'blue' | 'amber' | 'red';
}

export const parentOverviewStats: DashboardStat[] = [
  {
    title: 'Children Online',
    value: '2 of 2',
    label: 'All children connected',
    icon: Users,
    color: 'emerald'
  },
  {
    title: 'Location Coverage',
    value: '100%',
    label: 'Live GPS available',
    icon: MapPin,
    color: 'sky'
  },
  {
    title: 'Alerts Today',
    value: '1',
    label: 'Recent safety alerts',
    icon: AlertTriangle,
    color: 'amber'
  },
  {
    title: 'Emergency Events',
    value: '0',
    label: 'Emergency status normal',
    icon: ShieldCheck,
    color: 'green'
  }
];

export const parentChildrenList: ChildProfile[] = [
  {
    id: 'child-1',
    name: 'Ayesha Khan',
    grade: 'Grade 9',
    status: 'Safe',
    location: 'Science Block',
    lastUpdate: '3 mins ago',
    battery: 82,
    alertsToday: 0
  },
  {
    id: 'child-2',
    name: 'Ali Raza',
    grade: 'Grade 7',
    status: 'Attention',
    location: 'Library',
    lastUpdate: '7 mins ago',
    battery: 47,
    alertsToday: 1
  }
];

export const parentAnalyticsSummary = [
  {
    title: 'Safe Zone Entries',
    value: '98%',
    trend: '+4.2%',
    icon: ShieldCheck,
    color: 'green'
  },
  {
    title: 'Alert Response',
    value: '14 min',
    trend: '-1.1%',
    icon: Battery,
    color: 'blue'
  },
  {
    title: 'Device Health',
    value: '91%',
    trend: '+2.5%',
    icon: CheckCircle,
    color: 'emerald'
  },
  {
    title: 'Active Trackers',
    value: '2',
    trend: '+0',
    icon: Users,
    color: 'violet'
  }
];

export const parentSafetyTrends = [
  { label: 'Location updates', value: 85 },
  { label: 'Alerts resolved', value: 72 },
  { label: 'Emergency drills', value: 54 },
  { label: 'Device uptime', value: 91 }
];
