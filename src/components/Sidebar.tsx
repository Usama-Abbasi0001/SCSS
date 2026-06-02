import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  Users,
  Settings,
  LogOut,
  Shield,
  Bell,
  Activity,
  UserCircle,
  PhoneCall
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, userData } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const role = userData?.role;

    const commonItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Map, label: 'Live Tracking', path: '/tracking' },
      { icon: Bell, label: 'Alerts', path: '/alerts' },
      { icon: Settings, label: 'Settings', path: '/settings' }
    ];

    const roleSpecificItems = {
      admin: [
        { icon: Users, label: 'User Management', path: '/users' },
        { icon: Activity, label: 'Emergency Monitor', path: '/emergency' },
        { icon: Shield, label: 'Devices', path: '/devices' }
      ],
      student: [
        { icon: PhoneCall, label: 'Emergency Contacts', path: '/contacts' },
        { icon: UserCircle, label: 'Profile', path: '/profile' }
      ],
      parent: [
        { icon: Users, label: 'My Children', path: '/children' },
        { icon: Activity, label: 'Activity Log', path: '/activity' }
      ],
      security: [
        { icon: AlertTriangle, label: 'Emergency Response', path: '/response' },
        { icon: Activity, label: 'Incident Log', path: '/incidents' }
      ]
    };

    return [...commonItems, ...(roleSpecificItems[role as keyof typeof roleSpecificItems] || [])];
  };

  const navItems = getNavigationItems();

  return (
    <div className="w-64 h-screen bg-[#0a1628] border-r border-white/10 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-white">Campus Safety</h2>
            <p className="text-xs text-gray-400 capitalize">{userData?.role} Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-white/10">
        <div className="mb-3 p-3 bg-white/5 rounded-lg">
          <p className="text-white truncate">{userData?.name}</p>
          <p className="text-xs text-gray-400 truncate">{userData?.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all border border-red-500/30"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
