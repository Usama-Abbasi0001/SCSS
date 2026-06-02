import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import { Users, Shield, AlertTriangle, Activity, MapPin, Bell, TrendingUp, Battery } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);

  // Mock data - Replace with real Firebase data
  const stats = {
    totalStudents: 1247,
    activeDevices: 1189,
    todayAlerts: 3,
    emergencyCalls: 0,
    batteryLow: 12,
    safeZoneViolations: 5
  };

  const weeklyAlerts = [
    { day: 'Mon', alerts: 2 },
    { day: 'Tue', alerts: 4 },
    { day: 'Wed', alerts: 1 },
    { day: 'Thu', alerts: 6 },
    { day: 'Fri', alerts: 3 },
    { day: 'Sat', alerts: 0 },
    { day: 'Sun', alerts: 1 }
  ];

  const deviceStatus = [
    { name: 'Active', value: 1189, color: '#10b981' },
    { name: 'Inactive', value: 45, color: '#6b7280' },
    { name: 'Low Battery', value: 13, color: '#f59e0b' }
  ];

  const recentAlerts = [
    {
      id: 1,
      type: 'SOS',
      student: 'Sarah Johnson',
      location: 'Library Building',
      time: '2 mins ago',
      status: 'Active',
      severity: 'high'
    },
    {
      id: 2,
      type: 'Fall Detected',
      student: 'Mike Chen',
      location: 'Sports Complex',
      time: '15 mins ago',
      status: 'Resolved',
      severity: 'medium'
    },
    {
      id: 3,
      type: 'Safe Zone Exit',
      student: 'Emma Davis',
      location: 'Campus Gate 3',
      time: '1 hour ago',
      status: 'Acknowledged',
      severity: 'low'
    }
  ];

  useEffect(() => {
    // Simulate real-time alerts
    setLiveAlerts(recentAlerts);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-500/50 bg-red-500/10';
      case 'medium':
        return 'border-orange-500/50 bg-orange-500/10';
      case 'low':
        return 'border-yellow-500/50 bg-yellow-500/10';
      default:
        return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a1628] via-[#152238] to-[#1a2f4a]">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Real-time campus safety monitoring and analytics</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Users}
              label="Total Students"
              value={stats.totalStudents}
              change="+12 this month"
              changeType="positive"
              color="blue"
            />
            <StatCard
              icon={Shield}
              label="Active Devices"
              value={stats.activeDevices}
              change={`${Math.round((stats.activeDevices / stats.totalStudents) * 100)}% online`}
              changeType="positive"
              color="green"
            />
            <StatCard
              icon={AlertTriangle}
              label="Today's Alerts"
              value={stats.todayAlerts}
              change="-2 from yesterday"
              changeType="positive"
              color="orange"
            />
            <StatCard
              icon={Activity}
              label="Emergency Calls"
              value={stats.emergencyCalls}
              change="All clear"
              changeType="positive"
              color="purple"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Weekly Alerts Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <h3 className="text-white mb-4">Weekly Alert Trends</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyAlerts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a2f4a',
                      border: '1px solid #ffffff20',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="alerts" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Device Status Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <h3 className="text-white mb-4">Device Status Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deviceStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a2f4a',
                      border: '1px solid #ffffff20',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Recent Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white">Recent Alerts</h3>
              <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all border border-blue-500/30">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {liveAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg ${alert.severity === 'high' ? 'bg-red-500/20' : alert.severity === 'medium' ? 'bg-orange-500/20' : 'bg-yellow-500/20'} flex items-center justify-center border ${alert.severity === 'high' ? 'border-red-500/30' : alert.severity === 'medium' ? 'border-orange-500/30' : 'border-yellow-500/30'}`}>
                      <AlertTriangle className={`w-6 h-6 ${alert.severity === 'high' ? 'text-red-400' : alert.severity === 'medium' ? 'text-orange-400' : 'text-yellow-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-white">{alert.type}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${alert.status === 'Active' ? 'bg-red-500/20 text-red-400' : alert.status === 'Resolved' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {alert.status}
                        </span>
                      </div>
                      <p className="text-gray-400">{alert.student}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {alert.location}
                        </span>
                        <span>{alert.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all border border-blue-500/30">
                      View
                    </button>
                    {alert.status === 'Active' && (
                      <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all border border-green-500/30">
                        Respond
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
