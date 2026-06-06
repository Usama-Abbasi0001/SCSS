import { Home, Users, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ParentMenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
}

export const parentMenuItems: ParentMenuItem[] = [
  {
    label: 'Dashboard',
    path: '/parent',
    icon: Home,
    description: 'Overview and linked child information'
  },
  {
    label: 'My Child',
    path: '/parent/child',
    icon: Users,
    description: 'View child profile and status'
  },
  {
    label: 'Live Tracking',
    path: '/parent/tracking',
    icon: MapPin,
    description: 'Real-time location tracking'
  }
];
