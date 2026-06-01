import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AlarmProvider } from '../context/AlarmContext';
import AlarmModal from './AlarmModal';
import { useEffect, useState } from 'react';
import api from '../services/api';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/medications', label: 'Medications', icon: '💊' },
  { to: '/appointments', label: 'Appointments', icon: '📅' },
  { to: '/health', label: 'Health', icon: '❤️' },
  { to: '/reports', label: 'Reports', icon: '📊' },
  { to: '/caregivers', label: 'Caregivers', icon: '👥' },
  { to: '/notifications', label: 'Alerts', icon: '🔔' },
];

export default function Layout() {
  const { user, logout, selectedPatientId, setSelectedPatientId, patientQuery } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/notifications');
        setUnread(data.unreadCount || 0);
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const patients = user?.linkedPatients || [];

  return (
    <AlarmProvider>
    <AlarmModal />
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside
        className={`${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static z-40 w-64 bg-white dark:bg-slate-800 border-r border-medical-100 dark:border-slate-700 min-h-screen transition-transform`}
      >
        <div className="p-6 border-b border-medical-100 dark:border-slate-700">
          <h1 className="text-lg font-bold text-medical-700 dark:text-medical-300">
            Med & Health Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1 truncate">{user?.name}</p>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-medical-100 dark:bg-medical-900 text-medical-700 dark:text-medical-300 capitalize">
            {user?.role}
          </span>
        </div>

        {user?.role === 'caregiver' && patients.length > 0 && (
          <div className="p-4 border-b border-medical-100 dark:border-slate-700">
            <label className="label text-xs">Viewing patient</label>
            <select
              className="input text-sm"
              value={selectedPatientId || ''}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              {patients.map((p) => (
                <option key={p._id || p.id || p} value={p._id || p.id || p}>
                  {p.name || 'Patient'}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-medical-100 dark:bg-medical-900 text-medical-800 dark:text-medical-200'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-medical-50 dark:hover:bg-slate-700'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
              {item.to === '/notifications' && unread > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-1.5 rounded-full">
                  {unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-medical-100 dark:border-slate-700 space-y-2">
          <button type="button" onClick={toggleDarkMode} className="btn-secondary w-full text-sm">
            {darkMode ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>
          <button type="button" onClick={handleLogout} className="btn-secondary w-full text-sm text-red-600">
            Log out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <button
          type="button"
          className="md:hidden mb-4 btn-secondary"
          onClick={() => setMobileOpen(true)}
        >
          ☰ Menu
        </button>
        <Outlet context={{ patientQuery }} />
      </main>
    </div>
    </AlarmProvider>
  );
}
