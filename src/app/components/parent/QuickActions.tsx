import { useNavigate } from 'react-router-dom';
import { User, MapPin, AlertTriangle } from 'lucide-react';

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'view-child',
      label: 'View Child Profile',
      icon: User,
      description: 'View detailed information',
      path: '/parent/child',
      color: 'from-blue-600 to-blue-500',
      hoverColor: 'hover:from-blue-700 hover:to-blue-600'
    },
    {
      id: 'live-tracking',
      label: 'Live Tracking',
      icon: MapPin,
      description: 'Real-time GPS location',
      path: '/parent/tracking',
      color: 'from-emerald-600 to-emerald-500',
      hoverColor: 'hover:from-emerald-700 hover:to-emerald-600'
    },
    {
      id: 'emergency-history',
      label: 'Emergency History',
      icon: AlertTriangle,
      description: 'View past emergencies',
      path: '/parent/alerts',
      color: 'from-rose-600 to-rose-500',
      hoverColor: 'hover:from-rose-700 hover:to-rose-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {actions.map((action) => {
        const ActionIcon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => navigate(action.path)}
            className={`group relative rounded-2xl bg-gradient-to-br ${action.color} p-6 shadow-lg shadow-slate-950/30 transition-all duration-300 ${action.hoverColor} transform hover:-translate-y-1 overflow-hidden`}
          >
            {/* Background accent */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="flex-1 text-left">
                <h3 className="font-bold text-white text-lg">{action.label}</h3>
                <p className="text-sm text-white/80 mt-1">{action.description}</p>
              </div>
              <div className="flex-shrink-0 p-3 rounded-xl bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                <ActionIcon className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Arrow indicator */}
            <div className="absolute right-4 bottom-4 text-white/60 group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );
}
