import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { playAlarmSound, stopAlarmSound } from '../utils/alarmAudio';
import { todayStr, normalizeTime, getDoseLogForTime } from '../utils/timeHelpers';
import { format } from 'date-fns';

const AlarmContext = createContext(null);

const alarmKey = (type, id, time, date) => `${type}-${id}-${date}-${time}`;

export const AlarmProvider = ({ children }) => {
  const { user, patientQuery } = useAuth();
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [schedule, setSchedule] = useState({ medications: [], appointments: [] });

  const triggeredRef = useRef(new Set());
  const activeAlarmRef = useRef(null);
  const scheduleRef = useRef(schedule);

  useEffect(() => {
    activeAlarmRef.current = activeAlarm;
  }, [activeAlarm]);

  useEffect(() => {
    scheduleRef.current = schedule;
  }, [schedule]);

  const loadSchedule = useCallback(async () => {
    if (!user || user.role !== 'patient') return;
    try {
      const [medsRes, aptRes] = await Promise.all([
        api.get('/medications/today', { params: patientQuery }),
        api.get('/appointments', { params: patientQuery }),
      ]);
      setSchedule({
        medications: medsRes.data.medications || [],
        appointments: aptRes.data.appointments || [],
      });
    } catch (e) {
      console.error('Failed to load alarm schedule', e);
    }
  }, [user, patientQuery]);

  useEffect(() => {
    loadSchedule();
    const refresh = setInterval(loadSchedule, 60000);
    return () => clearInterval(refresh);
  }, [loadSchedule]);

  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'patient') requestNotificationPermission();
  }, [user, requestNotificationPermission]);

  const fireBrowserNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.svg' });
    }
    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
  };

  const startAlarm = useCallback((alarm) => {
    if (activeAlarmRef.current) return;
    setActiveAlarm(alarm);
    playAlarmSound();
    fireBrowserNotification(alarm.title, alarm.subtitle || alarm.time);
  }, []);

  const stopAlarm = useCallback(() => {
    stopAlarmSound();
    setActiveAlarm(null);
  }, []);

  const checkSchedules = useCallback(() => {
    if (!user || user.role !== 'patient') return;
    if (activeAlarmRef.current) return;

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const current = `${hh}:${mm}`;
    const date = todayStr();
    const { medications, appointments } = scheduleRef.current;

    medications.forEach((med) => {
      (med.times || []).forEach((raw) => {
        const time = normalizeTime(raw);
        if (time !== current) return;

        const log = getDoseLogForTime(med, time);
        if (log?.status === 'taken' || log?.status === 'missed') return;

        const key = alarmKey('med', med._id, time, date);
        if (triggeredRef.current.has(key)) return;
        triggeredRef.current.add(key);

        startAlarm({
          type: 'medication',
          key,
          medicationId: med._id,
          time,
          title: med.name,
          subtitle: med.dosage,
          med,
        });
      });
    });

    appointments.forEach((apt) => {
      const aptDate = format(new Date(apt.date), 'yyyy-MM-dd');
      const time = normalizeTime(apt.time);
      if (aptDate !== date || time !== current) return;

      const key = alarmKey('apt', apt._id, time, date);
      if (triggeredRef.current.has(key)) return;
      triggeredRef.current.add(key);

      startAlarm({
        type: 'appointment',
        key,
        appointmentId: apt._id,
        time,
        title: `Appointment: ${apt.doctorName}`,
        subtitle: apt.location || 'See your calendar for details',
      });
    });
  }, [user, startAlarm]);

  useEffect(() => {
    const day = todayStr();
    const stored = sessionStorage.getItem('alarm-day');
    if (stored !== day) {
      triggeredRef.current.clear();
      sessionStorage.setItem('alarm-day', day);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'patient') return undefined;
    const tick = setInterval(checkSchedules, 1000);
    const onVisible = () => {
      if (!document.hidden) checkSchedules();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, checkSchedules]);

  const markMedicationDose = async (status) => {
    if (!activeAlarm || activeAlarm.type !== 'medication') return;
    const { med, time } = activeAlarm;
    const log = getDoseLogForTime(med, time);
    try {
      await api.post(`/medications/${med._id}/dose`, {
        date: todayStr(),
        time,
        status,
        logId: log?._id,
      });
      await loadSchedule();
    } catch (e) {
      console.error(e);
    }
    stopAlarm();
  };

  return (
    <AlarmContext.Provider
      value={{
        activeAlarm,
        stopAlarm,
        markMedicationDose,
        refreshSchedule: loadSchedule,
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
};

export const useAlarm = () => useContext(AlarmContext);
