import ParentDashboard from '../../pages/parent/ParentDashboard';
import MyChild from '../../pages/parent/MyChild';
import LiveTracking from '../../pages/parent/LiveTracking';

export interface ParentRouteDefinition {
  path: string;
  element: JSX.Element;
}

export const parentRouteDefinitions: ParentRouteDefinition[] = [
  { path: '', element: <ParentDashboard /> },
  { path: 'child', element: <MyChild /> },
  { path: 'tracking', element: <LiveTracking /> }
];
