import { format, isToday, startOfDay } from 'date-fns';
import {
  todayStr,
  normalizeTime,
  getDoseLogForTime,
  buildScheduleDate,
  formatTimeRemaining,
} from './timeHelpers';

/** All dose slots today with status */
export const flattenTodayDoses = (medications) => {
  const slots = [];
  const today = todayStr();

  medications.forEach((med) => {
    (med.times || []).forEach((raw) => {
      const time = normalizeTime(raw);
      const log = getDoseLogForTime(med, time);
      const at = buildScheduleDate(time, today);
      slots.push({
        med,
        time,
        at,
        status: log?.status || 'upcoming',
        logId: log?._id,
      });
    });
  });

  return slots.sort((a, b) => a.at - b.at);
};

export const getNextDose = (medications) => {
  const now = new Date();
  const pending = flattenTodayDoses(medications).filter(
    (s) => s.status !== 'taken' && s.status !== 'missed'
  );
  const future = pending.filter((s) => s.at >= now);
  const next = future[0] || pending[0];
  if (!next) return null;
  return {
    name: next.med.name,
    dosage: next.med.dosage,
    time: next.time,
    at: next.at,
    remaining: formatTimeRemaining(next.at),
    within30Min: next.at - now <= 30 * 60 * 1000 && next.at >= now,
    isNow: next.at <= now,
  };
};

export const getPendingDosesCount = (medications) => {
  return flattenTodayDoses(medications).filter(
    (s) => s.status !== 'taken' && s.status !== 'missed'
  ).length;
};

export const getNextAppointment = (appointments) => {
  const now = new Date();
  const upcoming = [...appointments]
    .map((apt) => {
      const [h, m] = normalizeTime(apt.time).split(':').map(Number);
      const d = new Date(apt.date);
      d.setHours(h, m, 0, 0);
      return { ...apt, at: d };
    })
    .filter((a) => a.at >= now)
    .sort((a, b) => a.at - b.at);
  const next = upcoming[0];
  if (!next) return null;
  return {
    doctorName: next.doctorName,
    location: next.location,
    at: next.at,
    isToday: isToday(next.at),
    remaining: formatTimeRemaining(next.at),
  };
};

export const generateSmartInsight = (weekly, medications) => {
  const insights = [];
  const missedWeek = weekly?.days?.reduce((s, d) => s + (d.missed || 0), 0) || 0;
  const takenWeek = weekly?.days?.reduce((s, d) => s + (d.taken || 0), 0) || 0;

  if (missedWeek > 0) {
    insights.push(`You missed ${missedWeek} dose${missedWeek > 1 ? 's' : ''} this week.`);
  } else if (takenWeek > 0) {
    insights.push('Great job — no missed doses recorded this week.');
  }

  const nightMissed = (weekly?.missedByPeriod?.night || 0) > 0;
  const morningMissed = (weekly?.missedByPeriod?.morning || 0) > 0;
  if (nightMissed && nightMissed >= (weekly?.missedByPeriod?.afternoon || 0)) {
    insights.push('You often miss evening or night doses — try an earlier reminder.');
  }
  if (morningMissed > 2) {
    insights.push('Morning doses are frequently missed — keep medicine near your bed.');
  }

  const pending = getPendingDosesCount(medications);
  if (pending > 0) {
    insights.push(`${pending} dose${pending > 1 ? 's' : ''} still due today.`);
  }

  return insights[0] || 'Stay consistent with your schedule for better health outcomes.';
};
