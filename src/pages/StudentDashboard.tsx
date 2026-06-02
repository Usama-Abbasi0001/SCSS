import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import { Shield, MapPin, Battery, Activity, AlertCircle, Phone, Users } from 'lucide-react';
import { motion } from 'motion/react';

export default function StudentDashboard() {
  const [sosActive, setSosActive] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState({
    connected: true,
    battery: 87,
    gpsActive: true,
    lastSync: '2 mins ago'
  });

  const handleSOS = () => {
    if (!sosActive) {
      setSosActive(true);
      // In real app, this would trigger Firebase alert
      setTimeout(() => {
        alert('Emergency alert sent! Help is on the way.');
      }, 500);
    }
  };

  const emergencyContacts = [
    { name: 'Campus Security', phone: '+1 (555) 0100', type: 'Primary' },
    { name: 'Parent - John Doe', phone: '+1 (555) 0123', type: 'Family' },
    { name: 'Campus Health Center', phone: '+1 (555) 0200', type: 'Medical' }
  ];

  const recentActivity = [
    { action: 'Entered Safe Zone', location: 'Main Campus', time: '8:30 AM', status: 'safe' },
    { action: 'Device Connected', location: 'Automatic', time: '8:25 AM', status: 'info' },
    { action: 'Left Safe Zone', location: 'Dormitory', time: '8:20 AM', status: 'warning' }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a1628] via-[#152238] to-[#1a2f4a]">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white mb-2">Student Safety Dashboard</h1>
            <p className="text-gray-400">Your personal safety monitoring and emergency tools</p>
          </div>

          {/* SOS Emergency Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-red-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white mb-2">Emergency SOS</h2>
                <p className="text-gray-400 mb-4">
                  Press and hold to send emergency alert to campus security and your emergency contacts
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Your location will be shared automatically</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSOS}
                disabled={sosActive}
                className={`w-32 h-32 rounded-full ${
                  sosActive
                    ? 'bg-red-600 animate-pulse'
                    : 'bg-gradient-to-br from-red-600 to-red-500 hover:from-red-500 hover:to-red-400'
                } text-white shadow-2xl shadow-red-500/50 transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-2`}
              >
                <AlertCircle className="w-12 h-12" />
                <span className="font-bold">SOS</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Device Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Shield}
              label="Device Status"
              value={deviceStatus.connected ? 'Connected' : 'Disconnected'}
              change={deviceStatus.lastSync}
              changeType={deviceStatus.connected ? 'positive' : 'negative'}
              color="green"
            />
            <StatCard
              icon={Battery}
              label="Battery Level"
              value={`${deviceStatus.battery}%`}
              change={deviceStatus.battery > 20 ? 'Good' : 'Low Battery'}
              changeType={deviceStatus.battery > 20 ? 'positive' : 'negative'}
              color={deviceStatus.battery > 20 ? 'blue' : 'orange'}
            />
            <StatCard
              icon={MapPin}
              label="GPS Tracking"
              value={deviceStatus.gpsActive ? 'Active' : 'Inactive'}
              change="Live location sharing"
              changeType="positive"
              color="purple"
            />
            <StatCard
              icon={Activity}
              label="Health Status"
              value="Normal"
              change="72 BPM"
              changeType="positive"
              color="green"
            />
          </div>

          {/* Emergency Contacts & Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emergency Contacts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white">Emergency Contacts</h3>
                <Phone className="w-5 h-5 text-blue-400" />
              </div>

              <div className="space-y-3">
                {emergencyContacts.map((contact, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white mb-1">{contact.name}</h4>
                        <p className="text-gray-400 text-sm">{contact.phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all border border-green-500/30">
                          <Phone className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                      {contact.type}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white">Recent Activity</h3>
                <Activity className="w-5 h-5 text-blue-400" />
              </div>

              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 mt-2 rounded-full ${
                        activity.status === 'safe'
                          ? 'bg-green-400'
                          : activity.status === 'warning'
                          ? 'bg-orange-400'
                          : 'bg-blue-400'
                      }`}
                    />
                    <div className="flex-1">
                      <h4 className="text-white">{activity.action}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {activity.location}
                        </span>
                        <span className="text-sm text-gray-500">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Safety Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-blue-500/10 backdrop-blur-lg rounded-xl p-6 border border-blue-500/30"
          >
            <h3 className="text-white mb-4">Safety Tips</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Keep your device charged and connected at all times</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Always stay within designated safe zones when possible</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Update your emergency contacts regularly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Use the SOS button immediately if you feel unsafe</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
