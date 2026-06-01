import Medication from '../models/Medication.js';
import { resolveUserId } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getTodayBounds, computeMedTodayStats, computeTodaySummary } from '../utils/doseStats.js';

const ensureOwnership = async (medId, userId, user) => {
  const med = await Medication.findById(medId);
  if (!med) throw new AppError('Medication not found', 404);

  if (user.role === 'caregiver') {
    const linked = user.linkedPatients?.map((id) => id.toString()) || [];
    if (!linked.includes(med.user.toString())) {
      throw new AppError('Access denied', 403);
    }
  } else if (med.user.toString() !== userId.toString()) {
    throw new AppError('Access denied', 403);
  }
  return med;
};

export const getMedications = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const meds = await Medication.find({ user: userId, active: true }).sort({ createdAt: -1 });
    res.json({ success: true, medications: meds });
  } catch (err) {
    next(err);
  }
};

export const getTodayMedications = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    const meds = await Medication.find({ user: userId, active: true });
    const todayMeds = meds.filter((m) => {
      const start = new Date(m.startDate);
      start.setHours(0, 0, 0, 0);
      if (dayStart < start) return false;
      if (m.endDate) {
        const end = new Date(m.endDate);
        end.setHours(23, 59, 59, 999);
        if (dayStart > end) return false;
      }
      return true;
    });

    const { start, end } = getTodayBounds();
    const medications = todayMeds.map((m) => ({
      ...m.toObject(),
      todayStats: computeMedTodayStats(m, start, end),
    }));
    const summary = computeTodaySummary(todayMeds, start, end);

    res.json({ success: true, medications, summary });
  } catch (err) {
    next(err);
  }
};

export const createMedication = async (req, res, next) => {
  try {
    if (req.user.role === 'caregiver') {
      throw new AppError('Caregivers cannot add medications', 403);
    }
    const med = await Medication.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, medication: med });
  } catch (err) {
    next(err);
  }
};

export const updateMedication = async (req, res, next) => {
  try {
    const med = await ensureOwnership(req.params.id, req.user._id, req.user);
    if (req.user.role === 'caregiver') throw new AppError('Caregivers cannot edit medications', 403);
    Object.assign(med, req.body);
    await med.save();
    res.json({ success: true, medication: med });
  } catch (err) {
    next(err);
  }
};

export const deleteMedication = async (req, res, next) => {
  try {
    const med = await ensureOwnership(req.params.id, req.user._id, req.user);
    if (req.user.role === 'caregiver') throw new AppError('Caregivers cannot delete medications', 403);
    med.active = false;
    await med.save();
    res.json({ success: true, message: 'Medication removed' });
  } catch (err) {
    next(err);
  }
};

/** Normalize to HH:mm */
const normalizeTime = (t) => {
  const parts = String(t).split(':');
  const h = parts[0]?.padStart(2, '0') ?? '00';
  const m = parts[1]?.padStart(2, '0') ?? '00';
  return `${h}:${m}`;
};

/** Local datetime from YYYY-MM-DD + HH:mm (avoids UTC shift bugs) */
const parseLocalDateTime = (dateStr, timeStr) => {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [hh, mm] = normalizeTime(timeStr).split(':').map(Number);
  return new Date(y, mo - 1, d, hh, mm, 0, 0);
};

const sameSchedule = (stored, target) => {
  if (!stored || !target) return false;
  return new Date(stored).getTime() === new Date(target).getTime();
};

export const logDose = async (req, res, next) => {
  try {
    const { logId, status, notes, scheduledAt, date, time } = req.body;
    if (!status || !['taken', 'missed', 'pending'].includes(status)) {
      throw new AppError('Status must be taken or missed', 400);
    }

    const med = await ensureOwnership(req.params.id, req.user._id, req.user);
    if (req.user.role === 'caregiver') throw new AppError('Caregivers cannot log doses', 403);

    let when;
    if (date && time) {
      when = parseLocalDateTime(date, time);
    } else if (scheduledAt) {
      when = new Date(scheduledAt);
    } else {
      throw new AppError('Provide date and time', 400);
    }

    let log = null;
    if (logId) {
      try {
        log = med.doseLogs.id(logId);
      } catch {
        log = null;
      }
    }
    if (!log) {
      log = med.doseLogs.find((l) => l.scheduledAt && sameSchedule(l.scheduledAt, when));
    }

    if (log) {
      log.scheduledAt = when;
      log.status = status;
      log.takenAt = status === 'taken' ? new Date() : undefined;
      if (notes !== undefined) log.notes = notes;
    } else {
      med.doseLogs.push({
        scheduledAt: when,
        status,
        takenAt: status === 'taken' ? new Date() : undefined,
        notes,
      });
    }

    med.markModified('doseLogs');
    await med.save();

    const updated = await Medication.findById(med._id);
    res.json({ success: true, medication: updated });
  } catch (err) {
    next(err);
  }
};

export const getAdherenceLogs = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const meds = await Medication.find({ user: userId });
    const logs = [];
    meds.forEach((m) => {
      m.doseLogs.forEach((l) => {
        logs.push({
          medicationId: m._id,
          medicationName: m.name,
          dosage: m.dosage,
          scheduledAt: l.scheduledAt,
          status: l.status,
          takenAt: l.takenAt,
          notes: l.notes,
        });
      });
    });
    logs.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
};
