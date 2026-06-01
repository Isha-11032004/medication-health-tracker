import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const persist = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      const u = data.user;
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
      if (u.role === 'caregiver' && u.linkedPatients?.length && !selectedPatientId) {
        setSelectedPatientId(u.linkedPatients[0]._id || u.linkedPatients[0]);
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data.token, data.user);
    return data.user;
  };

  const register = async (form) => {
    const { data } = await api.post('/auth/register', form);
    persist(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSelectedPatientId(null);
  };

  const patientQuery = useMemo(
    () =>
      user?.role === 'caregiver' && selectedPatientId
        ? { patientId: selectedPatientId }
        : {},
    [user?.role, selectedPatientId]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        fetchMe,
        selectedPatientId,
        setSelectedPatientId,
        patientQuery,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
