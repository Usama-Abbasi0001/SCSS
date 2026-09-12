import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

import AdminDashboard from './pages/admin/AdminDashboard';
import StudentsList from './pages/admin/StudentsList';
import ParentsList from './pages/admin/ParentsList';
import CreateStudent from './pages/admin/CreateStudent';
import CreateParent from './pages/admin/CreateParent';
import AssignDevice from './pages/admin/AssignDevice';
import ActiveDevices from './pages/admin/ActiveDevices';
import ActiveAlerts from './pages/admin/ActiveAlerts';
import LiveAlerts from './pages/admin/LiveAlerts';
import SetupFirestore from './pages/admin/SetupFirestore';
import AdminHarassmentDashboard from './pages/admin/HarassmentDashboard';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import EmergencyStatus from './pages/student/EmergencyStatus';
import StudentLocation from './pages/student/StudentLocation';
import StudentAlerts from './pages/student/StudentAlerts';
import StudentHarassmentReport from './pages/student/HarassmentReport';

import ParentDashboard from './pages/parent/ParentDashboard';
import MyChild from './pages/parent/MyChild';
import LiveTracking from './pages/parent/LiveTracking';
import ParentAlerts from './pages/parent/ParentAlerts';
import ParentNotifications from './pages/parent/ParentNotifications';
import ParentDeviceStatus from './pages/parent/ParentDeviceStatus';
import ParentLocationUpdates from './pages/parent/ParentLocationUpdates';
import ParentHarassmentAlerts from './pages/parent/ParentHarassmentAlerts';

export default function App() {
  function HomeRedirect() {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
          <div className="text-center space-y-2 px-6 py-8 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl">
            <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-slate-800 animate-spin mx-auto" />
            <p className="text-sm text-slate-300">Checking authentication…</p>
          </div>
        </div>
      );
    }

    if (user) {
      return <Navigate to={`/${user.role}`} replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout role="admin">
                  <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="students" element={<StudentsList />} />
                    <Route path="parents" element={<ParentsList />} />
                    <Route path="create-student" element={<CreateStudent />} />
                    <Route path="create-parent" element={<CreateParent />} />
                    <Route path="assign-device" element={<AssignDevice />} />
                    <Route path="active-devices" element={<ActiveDevices />} />
                    <Route path="active-alerts" element={<ActiveAlerts />} />
                    <Route path="alerts" element={<LiveAlerts />} />
                    <Route path="setup-firestore" element={<SetupFirestore />} />
                    <Route path="harassment" element={<AdminHarassmentDashboard />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout role="student">
                  <Routes>
                    <Route index element={<StudentDashboard />} />
                    <Route path="profile" element={<StudentProfile />} />
                    <Route path="emergency" element={<EmergencyStatus />} />
                    <Route path="location" element={<StudentLocation />} />
                    <Route path="alerts" element={<StudentAlerts />} />
                    <Route path="harassment" element={<StudentHarassmentReport />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Parent Routes */}
          <Route
            path="/parent/*"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <DashboardLayout role="parent">
                  <Routes>
                    <Route index element={<ParentDashboard />} />
                    <Route path="child" element={<MyChild />} />
                    <Route path="tracking" element={<LiveTracking />} />
                    <Route path="alerts" element={<ParentAlerts />} />
                    <Route path="notifications" element={<ParentNotifications />} />
                    <Route path="device-status" element={<ParentDeviceStatus />} />
                    <Route path="location-updates" element={<ParentLocationUpdates />} />
                    <Route path="harassment" element={<ParentHarassmentAlerts />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}