import { format } from 'date-fns';

export const todayStr = () => format(new Date(), 'yyyy-MM-dd');

export const normalizeTime = (t) => {
  const parts = String(t).split(':');
  return `${parts[0]?.padStart(2, '0') ?? '00'}:${parts[1]?.padStart(2, '0') ?? '00'}`;
};

export const getDoseLogForTime = (med, timeStr) => {
  const slot = normalizeTime(timeStr);
  const today = todayStr();
  return med.doseLogs?.find((log) => {
    if (!log.scheduledAt) return false;
    const s = new Date(log.scheduledAt);
    return format(s, 'yyyy-MM-dd') === today && format(s, 'HH:mm') === slot;
  });
};

export const buildScheduleDate = (timeStr, dateStr = todayStr()) => {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [hh, mm] = normalizeTime(timeStr).split(':').map(Number);
  return new Date(y, mo - 1, d, hh, mm, 0, 0);
};

export const formatTimeRemaining = (targetDate) => {
  const ms = targetDate - new Date();
  if (ms <= 0) return 'now';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hrs < 24) return rem > 0 ? `in ${hrs}h ${rem}m` : `in ${hrs} hour${hrs > 1 ? 's' : ''}`;
  const days = Math.floor(hrs / 24);
  return `in ${days} day${days > 1 ? 's' : ''}`;
};
