import { BarChart3, Home, Settings, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ParentMenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
}

export const parentMenuItems: ParentMenuItem[] = [
  {
    label: 'Overview',
    path: '/parent',
    icon: Home,
    description: 'Parent dashboard overview and real-time status'
  },
  {
    label: 'Children',
    path: '/parent/children',
    icon: Users,
    description: 'Manage your children and device status'
  },
  {
    label: 'Analytics',
    path: '/parent/analytics',
    icon: BarChart3,
    description: 'Trend insights and safety analytics'
  },
  {
    label: 'Settings',
    path: '/parent/settings',
    icon: Settings,
    description: 'Notification and safety preferences'
  }
];
