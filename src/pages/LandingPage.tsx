import { Link } from 'react-router-dom';
import { Shield, MapPin, Bell, Activity, Users, Lock, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const features = [
    {
      icon: MapPin,
      title: 'Real-time GPS Tracking',
      description: 'Track students in real-time with precise GPS location monitoring across campus'
    },
    {
      icon: Bell,
      title: 'Instant SOS Alerts',
      description: 'Emergency button sends immediate alerts to security and parents'
    },
    {
      icon: Activity,
      title: 'Health Monitoring',
      description: 'Track vital signs including heart rate and fall detection'
    },
    {
      icon: Shield,
      title: 'Safe Zone Management',
      description: 'Define and monitor safe zones with automatic alerts for violations'
    },
    {
      icon: Users,
      title: 'Parent Dashboard',
      description: 'Parents can monitor their children\'s location and safety status'
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'End-to-end encryption ensures data privacy and security'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#152238] to-[#1a2f4a]">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-white text-xl">Campus Safety</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="px-6 py-2 text-white hover:text-blue-400 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/30"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-white mb-6 text-5xl">
            Smart Campus Safety System
          </h1>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto mb-8">
            Comprehensive real-time student safety monitoring platform powered by IoT, GPS tracking,
            and instant emergency response systems
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/30 text-lg"
            >
              Start Free Trial
            </Link>
            <button className="px-8 py-4 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all border border-white/10 text-lg">
              Watch Demo
            </button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-blue-500/30 transition-all"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 border border-blue-500/30">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-12 border border-white/10 mb-20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h2 className="text-white text-4xl mb-2">1000+</h2>
              <p className="text-gray-400">Active Students</p>
            </div>
            <div>
              <h2 className="text-white text-4xl mb-2">99.9%</h2>
              <p className="text-gray-400">System Uptime</p>
            </div>
            <div>
              <h2 className="text-white text-4xl mb-2">24/7</h2>
              <p className="text-gray-400">Emergency Support</p>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10"
        >
          <h2 className="text-white mb-4">Ready to Make Your Campus Safer?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Join hundreds of educational institutions using our platform to protect their students
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/30"
          >
            Get Started Today
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <p className="text-gray-500">© 2026 Smart Campus Safety System. All rights reserved.</p>
            <div className="flex gap-6 text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
