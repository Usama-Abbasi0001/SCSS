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
  Database,
  Activity,
  Cpu,
  ShieldAlert
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
    { name: 'Harassment', path: '/admin/harassment', icon: ShieldAlert },
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
    { name: 'Harassment', path: '/student/harassment', icon: ShieldAlert },
    { name: 'Profile', path: '/student/profile', icon: User },
    { name: 'Emergency Status', path: '/student/emergency', icon: AlertTriangle },
    { name: 'Location', path: '/student/location', icon: MapPin },
    { name: 'Alert History', path: '/student/alerts', icon: Bell }
  ],
  parent: [
    { name: 'Dashboard', path: '/parent', icon: LayoutDashboard },
    { name: 'Harassment Alerts', path: '/parent/harassment', icon: ShieldAlert },
    { name: 'My Child', path: '/parent/child', icon: User },
    { name: 'Live Tracking', path: '/parent/tracking', icon: MapPin },
    { name: 'Alerts', path: '/parent/alerts', icon: AlertTriangle },
    { name: 'Notifications', path: '/parent/notifications', icon: Bell },
    { name: 'Device Status', path: '/parent/device-status', icon: Cpu },
    { name: 'Location Updates', path: '/parent/location-updates', icon: Activity }
  ]
};

export default function Sidebar({ role, open, onClose, onLogout }: SidebarProps) {
  const location = useLocation();
  const links = roleLinks[role] || [];
  const { user } = useAuth();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform overflow-hidden border-r border-slate-800 bg-slate-950 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:fixed`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-tight">Campus Safety</h1>
                <p className="text-xs text-slate-400 capitalize">{role} Control Panel</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r from-slate-800 to-slate-850 text-white shadow-md shadow-slate-900/30 border border-slate-700/80`
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                  }`}
                >
                  <link.icon className={`h-5 w-5 transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-800 p-4 mt-auto">
            <div className="mb-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800">
              <p className="text-xs font-semibold text-white truncate">{user?.name || user?.email || 'Authenticated User'}</p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">Role: <span className="text-cyan-400 capitalize">{user?.role || role}</span></p>
            </div>

            <button
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r text-sm font-semibold from-rose-900/30 via-slate-800 to-slate-900 border border-slate-800 px-4 py-3 text-slate-200 shadow-sm transition hover:text-white hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4 text-rose-400" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
