import { Outlet, useLocation } from 'react-router-dom';
import ParentNavbar from './ParentNavbar';
import ParentSidebar from './ParentSidebar';
import ErrorBoundary from '../ErrorBoundary';

const titleMap: Record<string, string> = {
  '/parent': 'Parent Dashboard',
  '/parent/children': 'Children',
  '/parent/analytics': 'Analytics',
  '/parent/settings': 'Settings',
  '/parent/child': 'Child Profile',
  '/parent/tracking': 'Live Tracking',
  '/parent/alerts': 'Alerts',
  '/parent/notifications': 'Notifications'
};

export default function ParentPortalLayout() {
  const location = useLocation();
  const title = titleMap[location.pathname] ?? 'Parent Dashboard';

  return (
    <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <ParentSidebar />
      <div className="space-y-6">
        <ParentNavbar title={title} />
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
    </div>
  );
}
