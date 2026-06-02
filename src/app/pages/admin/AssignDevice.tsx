import { useEffect, useState } from 'react';
import { Shield, CheckCircle } from 'lucide-react';
import { collection, doc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { StudentDocument, DeviceDocument } from '../../types/firestore';

export default function AssignDevice() {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [success, setSuccess] = useState(false);
  const [students, setStudents] = useState<StudentDocument[]>([]);
  const [devices, setDevices] = useState<DeviceDocument[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      setStudents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as StudentDocument)));
    });

    const unsubDevices = onSnapshot(collection(db, 'devices'), (snapshot) => {
      setDevices(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DeviceDocument)));
    });

    return () => {
      unsubStudents();
      unsubDevices();
    };
  }, []);

  useEffect(() => {
    const ensureDevices = async () => {
      if (devices.length === 0) {
        const snapshot = await getDocs(collection(db, 'devices'));
        setDevices(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DeviceDocument)));
      }
    };

    ensureDevices();
  }, [devices.length]);

  const availableDevices = devices.filter((device) => !device.assignedTo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedStudent || !selectedDevice) {
      setError('Please select both a student and a device.');
      return;
    }

    try {
      const deviceRef = doc(db, 'devices', selectedDevice);
      await updateDoc(deviceRef, {
        assignedTo: selectedStudent
      });

      const studentRef = doc(db, 'students', selectedStudent);
      await updateDoc(studentRef, {
        deviceId: selectedDevice
      }).catch(() => {
        // ignore missing student update
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedStudent('');
        setSelectedDevice('');
      }, 3000);
    } catch (err) {
      setError('Unable to assign device right now. Please try again.');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Assign Device</h1>
        <p className="text-slate-400 mt-2">Link ESP32 tracking devices to students</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-slate-950/95 rounded-3xl border border-white/10 shadow-2xl shadow-slate-950/30 p-8 mb-6">
          {success ? (
            <div className="text-center py-12">
              <div className="bg-emerald-500/15 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-300">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">Device Assigned!</h2>
              <p className="text-slate-400">The tracking device has been successfully linked.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Student *
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  required
                >
                  <option value="">Choose a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.registrationNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Device *
                </label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  required
                >
                  <option value="">Choose a device</option>
                  {availableDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name} ({device.id})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {availableDevices.length} available devices
                </p>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-white font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Assign Device
              </button>
            </form>
          )}
        </div>

        <div className="bg-slate-950/95 rounded-3xl border border-white/10 p-6 shadow-2xl shadow-slate-950/30">
          <h3 className="font-semibold text-white mb-4">Currently Assigned Devices</h3>
          <div className="space-y-3">
            {devices.filter((device) => device.assignedTo).length === 0 ? (
              <p className="text-sm text-slate-500">No devices are currently assigned.</p>
            ) : (
              devices.filter((device) => device.assignedTo).map((device) => {
                const student = students.find((s) => s.id === device.assignedTo);
                return (
                  <div key={device.id} className="flex items-center justify-between p-3 bg-slate-900/80 rounded-3xl">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      <div>
                        <p className="font-medium text-white">{device.id}</p>
                        <p className="text-sm text-slate-400">{student?.name || 'Unknown student'}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-500/15 text-emerald-300 px-3 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
