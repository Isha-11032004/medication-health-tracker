/** Today's date range (local midnight to midnight) */
export const getTodayBounds = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

export const isScheduledToday = (scheduledAt, start, end) => {
  const s = new Date(scheduledAt);
  return s >= start && s < end;
};

export const normalizeTime = (t) => {
  const parts = String(t).split(':');
  return `${parts[0]?.padStart(2, '0') ?? '00'}:${parts[1]?.padStart(2, '0') ?? '00'}`;
};

/** Per-medicine stats for today only */
export const computeMedTodayStats = (med, start, end) => {
  const scheduled = med.times?.length || 0;
  let taken = 0;
  let missed = 0;
  let pending = 0;

  (med.doseLogs || []).forEach((log) => {
    if (!log.scheduledAt || !isScheduledToday(log.scheduledAt, start, end)) return;
    if (log.status === 'taken') taken += 1;
    else if (log.status === 'missed') missed += 1;
    else pending += 1;
  });

  const recorded = taken + missed + pending;
  const notYetRecorded = Math.max(0, scheduled - recorded);
  const answered = taken + missed;
  const adherencePercent = answered > 0 ? Math.round((taken / answered) * 100) : null;

  return {
    scheduled,
    taken,
    missed,
    pending,
    notYetRecorded,
    adherencePercent,
  };
};

/** Sum across all medicines for today */
export const computeTodaySummary = (medications, start, end) => {
  let taken = 0;
  let missed = 0;
  let scheduled = 0;

  const perMedication = medications.map((m) => {
    const stats = computeMedTodayStats(m, start, end);
    taken += stats.taken;
    missed += stats.missed;
    scheduled += stats.scheduled;
    return {
      medicationId: m._id,
      name: m.name,
      dosage: m.dosage,
      ...stats,
    };
  });

  const answered = taken + missed;
  const adherencePercent = answered > 0 ? Math.round((taken / answered) * 100) : 100;

  return {
    taken,
    missed,
    scheduled,
    adherencePercent,
    medicationCount: medications.length,
    perMedication,
  };
};
