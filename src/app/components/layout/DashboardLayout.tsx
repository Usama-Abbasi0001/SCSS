import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'admin' | 'student' | 'parent';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#071323] text-slate-100">
      <Sidebar role={role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 py-4 lg:px-6 xl:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-200 hover:bg-slate-800 transition-all lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-sm text-slate-400">{role.charAt(0).toUpperCase() + role.slice(1)} Panel</p>
                <h1 className="text-xl font-semibold tracking-tight text-white">Smart Campus Safety System</h1>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-sm text-slate-400">
              <span className="rounded-2xl bg-slate-900/80 px-4 py-2 border border-slate-800">{location.pathname}</span>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-72px)] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl transition-all duration-300 ease-out">
            <div className="space-y-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
