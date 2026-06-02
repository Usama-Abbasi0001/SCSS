import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import Login from './pages/Login';
import Signup from './pages/Signup';

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

import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import EmergencyStatus from './pages/student/EmergencyStatus';
import StudentLocation from './pages/student/StudentLocation';
import StudentAlerts from './pages/student/StudentAlerts';

import ParentDashboard from './pages/parent/ParentDashboard';
import ChildProfile from './pages/parent/ChildProfile';
import LiveTracking from './pages/parent/LiveTracking';
import ParentAlerts from './pages/parent/ParentAlerts';
import ParentNotifications from './pages/parent/ParentNotifications';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

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
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

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
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/*"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <DashboardLayout role="parent">
                  <Routes>
                    <Route index element={<ParentDashboard />} />
                    <Route path="child" element={<ChildProfile />} />
                    <Route path="tracking" element={<LiveTracking />} />
                    <Route path="alerts" element={<ParentAlerts />} />
                    <Route path="notifications" element={<ParentNotifications />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}