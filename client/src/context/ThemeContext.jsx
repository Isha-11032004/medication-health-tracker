import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return false; // default: light mode
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = async () => {
    const next = !darkMode;
    setDarkMode(next);
    try {
      const token = localStorage.getItem('token');
      if (token) await api.patch('/auth/profile', { darkMode: next });
    } catch {
      /* ignore sync errors */
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
