import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LucideIcon, X } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  AlertTriangle,
  LogOut,
  User,
  MapPin,
  Bell,
  Shield,
  Database
} from 'lucide-react';

interface SidebarLink {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface SidebarProps {
  role: 'admin' | 'student' | 'parent';
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const roleLinks: Record<string, SidebarLink[]> = {
  admin: [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Parents', path: '/admin/parents', icon: Users },
    { name: 'Create Student', path: '/admin/create-student', icon: UserPlus },
    { name: 'Create Parent', path: '/admin/create-parent', icon: UserPlus },
    { name: 'Assign Device', path: '/admin/assign-device', icon: Shield },
    { name: 'Live Alerts', path: '/admin/alerts', icon: AlertTriangle },
    { name: 'Setup Firestore', path: '/admin/setup-firestore', icon: Database }
  ],
  student: [
    { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
    { name: 'Profile', path: '/student/profile', icon: User },
    { name: 'Emergency Status', path: '/student/emergency', icon: AlertTriangle },
    { name: 'Location', path: '/student/location', icon: MapPin },
    { name: 'Alert History', path: '/student/alerts', icon: Bell }
  ],
  parent: [
    { name: 'Dashboard', path: '/parent', icon: LayoutDashboard },
    { name: 'Child Profile', path: '/parent/child', icon: User },
    { name: 'Live Tracking', path: '/parent/tracking', icon: MapPin },
    { name: 'Alerts', path: '/parent/alerts', icon: AlertTriangle },
    { name: 'Notifications', path: '/parent/notifications', icon: Bell }
  ]
};

export default function Sidebar({ role, open, onClose, onLogout }: SidebarProps) {
  const location = useLocation();
  const links = roleLinks[role];
  const { user } = useAuth();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity lg:hidden ${open ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform overflow-hidden border-r border-slate-800 bg-slate-950 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:fixed`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
            <div>
              <h1 className="text-lg font-bold text-white">Campus Safety</h1>
              <p className="text-sm text-slate-400 capitalize">{role} Panel</p>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? `bg-slate-800 text-white shadow-md shadow-slate-900/20`
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <link.icon className="h-5 w-5 transition-colors duration-200" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-800 p-4 mt-auto">
            <div className="mb-3 p-3 bg-slate-900 rounded-xl">
              <p className="text-sm text-white truncate">{user?.email ?? '—'}</p>
              <p className="text-xs text-slate-400 truncate">Role: {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—'}</p>
            </div>

            <button
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r text-sm font-semibold from-slate-700 via-slate-800 to-slate-900 px-4 py-3 text-white shadow-sm shadow-slate-950/30 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
