import ParentDashboard from '../../pages/parent/ParentDashboard';
import ParentChildren from './ParentChildren';
import ParentAnalytics from './ParentAnalytics';
import ParentSettings from './ParentSettings';

export interface ParentRouteDefinition {
  path: string;
  element: JSX.Element;
}

export const parentRouteDefinitions: ParentRouteDefinition[] = [
  { path: '', element: <ParentDashboard /> },
  { path: 'children', element: <ParentChildren /> },
  { path: 'analytics', element: <ParentAnalytics /> },
  { path: 'settings', element: <ParentSettings /> }
];
