import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Medications from './pages/Medications';
import Appointments from './pages/Appointments';
import HealthTracker from './pages/HealthTracker';
import Reports from './pages/Reports';
import Caregivers from './pages/Caregivers';
import AcceptInvite from './pages/AcceptInvite';
import Notifications from './pages/Notifications';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-medical-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="medications" element={<Medications />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="health" element={<HealthTracker />} />
        <Route path="reports" element={<Reports />} />
        <Route path="caregivers" element={<Caregivers />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
