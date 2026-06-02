import { useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { GoogleMap, LoadScript, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { MapPin, Users, AlertTriangle, Shield, Battery, Navigation } from 'lucide-react';
import { motion } from 'motion/react';

export default function LiveTracking() {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 });
  const [showSafeZones, setShowSafeZones] = useState(true);

  // Replace with your actual Google Maps API key
  const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

  // Mock student data with live locations
  const students = [
    {
      id: 1,
      name: 'Sarah Johnson',
      studentId: 'STU2023001',
      location: { lat: 40.7128, lng: -74.0060 },
      status: 'safe',
      battery: 87,
      lastUpdate: '2 mins ago',
      device: 'ESP32-001'
    },
    {
      id: 2,
      name: 'Mike Chen',
      studentId: 'STU2023002',
      location: { lat: 40.7138, lng: -74.0070 },
      status: 'safe',
      battery: 65,
      lastUpdate: '1 min ago',
      device: 'ESP32-002'
    },
    {
      id: 3,
      name: 'Emma Davis',
      studentId: 'STU2023003',
      location: { lat: 40.7118, lng: -74.0050 },
      status: 'alert',
      battery: 12,
      lastUpdate: 'Just now',
      device: 'ESP32-003'
    },
    {
      id: 4,
      name: 'John Smith',
      studentId: 'STU2023004',
      location: { lat: 40.7148, lng: -74.0080 },
      status: 'safe',
      battery: 92,
      lastUpdate: '3 mins ago',
      device: 'ESP32-004'
    }
  ];

  // Safe zones (geo-fencing)
  const safeZones = [
    {
      id: 1,
      name: 'Main Campus',
      center: { lat: 40.7128, lng: -74.0060 },
      radius: 500,
      color: '#10b981'
    },
    {
      id: 2,
      name: 'Sports Complex',
      center: { lat: 40.7148, lng: -74.0080 },
      radius: 300,
      color: '#3b82f6'
    }
  ];

  const mapStyles = {
    height: '100%',
    width: '100%'
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    styles: [
      {
        featureType: 'all',
        elementType: 'geometry',
        stylers: [{ color: '#1a2f4a' }]
      },
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca3af' }]
      },
      {
        featureType: 'all',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#0a1628' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#0f172a' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#2d3748' }]
      }
    ]
  };

  const getMarkerIcon = (status: string) => {
    return status === 'alert'
      ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
      : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
  };

  const onMarkerClick = useCallback((student: any) => {
    setSelectedStudent(student);
    setMapCenter(student.location);
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a1628] via-[#152238] to-[#1a2f4a]">
      <Sidebar />

      <div className="flex-1 flex">
        {/* Map Section */}
        <div className="flex-1 relative">
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={mapStyles}
              zoom={14}
              center={mapCenter}
              options={mapOptions}
            >
              {/* Student Markers */}
              {students.map((student) => (
                <Marker
                  key={student.id}
                  position={student.location}
                  onClick={() => onMarkerClick(student)}
                  icon={{
                    url: getMarkerIcon(student.status),
                    scaledSize: new window.google.maps.Size(40, 40)
                  }}
                  animation={student.status === 'alert' ? window.google.maps.Animation.BOUNCE : undefined}
                />
              ))}

              {/* Safe Zones */}
              {showSafeZones &&
                safeZones.map((zone) => (
                  <Circle
                    key={zone.id}
                    center={zone.center}
                    radius={zone.radius}
                    options={{
                      fillColor: zone.color,
                      fillOpacity: 0.15,
                      strokeColor: zone.color,
                      strokeOpacity: 0.5,
                      strokeWeight: 2
                    }}
                  />
                ))}

              {/* Info Window */}
              {selectedStudent && (
                <InfoWindow
                  position={selectedStudent.location}
                  onCloseClick={() => setSelectedStudent(null)}
                >
                  <div className="p-2 bg-[#1a2f4a] text-white rounded-lg">
                    <h4 className="font-semibold mb-2">{selectedStudent.name}</h4>
                    <p className="text-sm text-gray-300 mb-1">ID: {selectedStudent.studentId}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Battery className="w-4 h-4" />
                      <span>{selectedStudent.battery}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Shield className="w-4 h-4" />
                      <span>{selectedStudent.device}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{selectedStudent.lastUpdate}</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>

          {/* Map Controls */}
          <div className="absolute top-4 left-4 space-y-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowSafeZones(!showSafeZones)}
              className={`px-4 py-2 rounded-lg backdrop-blur-lg border transition-all ${
                showSafeZones
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  : 'bg-white/10 border-white/20 text-white'
              }`}
            >
              {showSafeZones ? 'Hide' : 'Show'} Safe Zones
            </motion.button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-[#0a1628]/90 backdrop-blur-lg rounded-lg p-4 border border-white/10">
            <h4 className="text-white mb-3">Map Legend</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-gray-300">Safe Student</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
                <span className="text-gray-300">Alert/Emergency</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400 opacity-30" />
                <span className="text-gray-300">Safe Zone</span>
              </div>
            </div>
          </div>
        </div>

        {/* Student List Sidebar */}
        <div className="w-80 bg-[#0a1628] border-l border-white/10 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white">Live Students</h3>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30">
                {students.length} Online
              </span>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search students..."
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Student List */}
            <div className="space-y-3">
              {students.map((student) => (
                <motion.div
                  key={student.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onMarkerClick(student)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedStudent?.id === student.id
                      ? 'bg-blue-500/20 border-blue-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white mb-1">{student.name}</h4>
                      <p className="text-xs text-gray-400">{student.studentId}</p>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        student.status === 'safe' ? 'bg-green-400' : 'bg-red-400 animate-pulse'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Battery className="w-3 h-3" />
                      {student.battery}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {student.device}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{student.lastUpdate}</span>
                    <button className="p-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-all">
                      <Navigation className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
