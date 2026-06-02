import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import { Users, MapPin, Shield, AlertCircle, Battery, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function ParentDashboard() {
  const [selectedChild, setSelectedChild] = useState(0);

  const children = [
    {
      id: 1,
      name: 'Emma Wilson',
      studentId: 'STU2023001',
      grade: '10th Grade',
      status: 'safe',
      location: 'Library Building',
      lastUpdate: '2 mins ago',
      battery: 87,
      deviceConnected: true,
      todayAlerts: 0
    },
    {
      id: 2,
      name: 'Noah Wilson',
      studentId: 'STU2023045',
      grade: '8th Grade',
      status: 'safe',
      location: 'Main Campus',
      lastUpdate: '5 mins ago',
      battery: 45,
      deviceConnected: true,
      todayAlerts: 1
    }
  ];

  const child = children[selectedChild];

  const recentActivity = [
    { event: 'Arrived at School', location: 'Main Gate', time: '8:15 AM', type: 'arrival' },
    { event: 'Entered Safe Zone', location: 'Library Building', time: '10:30 AM', type: 'safe' },
    { event: 'Low Battery Alert', location: 'Automatic', time: '11:45 AM', type: 'warning' },
    { event: 'Device Charged', location: 'Classroom B-203', time: '12:30 PM', type: 'info' }
  ];

  const scheduleToday = [
    { time: '8:00 AM', subject: 'Mathematics', room: 'A-101', status: 'completed' },
    { time: '9:30 AM', subject: 'Science', room: 'B-205', status: 'completed' },
    { time: '11:00 AM', subject: 'English', room: 'C-302', status: 'in-progress' },
    { time: '1:00 PM', subject: 'Physical Education', room: 'Sports Complex', status: 'upcoming' }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a1628] via-[#152238] to-[#1a2f4a]">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white mb-2">Parent Dashboard</h1>
            <p className="text-gray-400">Monitor your children's safety and activities</p>
          </div>

          {/* Child Selector */}
          <div className="mb-6 flex gap-4">
            {children.map((c, index) => (
              <button
                key={c.id}
                onClick={() => setSelectedChild(index)}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all ${
                  selectedChild === index
                    ? 'bg-blue-500/20 border-2 border-blue-500/50'
                    : 'bg-white/5 border border-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">{c.name[0]}</span>
                </div>
                <div className="text-left">
                  <h4 className="text-white">{c.name}</h4>
                  <p className="text-sm text-gray-400">{c.grade}</p>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    c.status === 'safe' ? 'bg-green-400' : 'bg-orange-400'
                  } animate-pulse`}
                />
              </button>
            ))}
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Shield}
              label="Safety Status"
              value={child.status === 'safe' ? 'Safe' : 'Alert'}
              change={child.lastUpdate}
              changeType={child.status === 'safe' ? 'positive' : 'negative'}
              color={child.status === 'safe' ? 'green' : 'red'}
            />
            <StatCard
              icon={MapPin}
              label="Current Location"
              value={child.location}
              change="Inside safe zone"
              changeType="positive"
              color="blue"
            />
            <StatCard
              icon={Battery}
              label="Device Battery"
              value={`${child.battery}%`}
              change={child.battery > 20 ? 'Good' : 'Low'}
              changeType={child.battery > 20 ? 'positive' : 'negative'}
              color={child.battery > 20 ? 'green' : 'orange'}
            />
            <StatCard
              icon={AlertCircle}
              label="Today's Alerts"
              value={child.todayAlerts}
              change={child.todayAlerts === 0 ? 'All clear' : 'Needs attention'}
              changeType={child.todayAlerts === 0 ? 'positive' : 'negative'}
              color={child.todayAlerts === 0 ? 'green' : 'orange'}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-blue-500/20 rounded-xl border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              <span>Track Live Location</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-green-500/20 rounded-xl border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              <span>View Activity Log</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-purple-500/20 rounded-xl border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              <span>Safety Settings</span>
            </motion.button>
          </div>

          {/* Activity & Schedule Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <h3 className="text-white mb-6">Recent Activity</h3>

              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="relative">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          activity.type === 'arrival'
                            ? 'bg-blue-500/20 border border-blue-500/30'
                            : activity.type === 'safe'
                            ? 'bg-green-500/20 border border-green-500/30'
                            : activity.type === 'warning'
                            ? 'bg-orange-500/20 border border-orange-500/30'
                            : 'bg-purple-500/20 border border-purple-500/30'
                        }`}
                      >
                        {activity.type === 'arrival' && <MapPin className="w-5 h-5 text-blue-400" />}
                        {activity.type === 'safe' && <CheckCircle className="w-5 h-5 text-green-400" />}
                        {activity.type === 'warning' && <AlertCircle className="w-5 h-5 text-orange-400" />}
                        {activity.type === 'info' && <Battery className="w-5 h-5 text-purple-400" />}
                      </div>
                      {index < recentActivity.length - 1 && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-white/10" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white">{activity.event}</h4>
                      <p className="text-sm text-gray-400 mt-1">{activity.location}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Today's Schedule */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <h3 className="text-white mb-6">Today's Schedule</h3>

              <div className="space-y-3">
                {scheduleToday.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      item.status === 'in-progress'
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : item.status === 'completed'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{item.time}</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.status === 'in-progress'
                            ? 'bg-blue-500/20 text-blue-400'
                            : item.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <h4 className="text-white mb-1">{item.subject}</h4>
                    <p className="text-sm text-gray-400">{item.room}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
