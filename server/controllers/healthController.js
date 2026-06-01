import HealthLog from '../models/HealthLog.js';
import { resolveUserId } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const getHealthLogs = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const { from, to, limit = 100 } = req.query;
    const filter = { user: userId };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const logs = await HealthLog.find(filter).sort({ date: -1 }).limit(Number(limit));
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
};

export const createHealthLog = async (req, res, next) => {
  try {
    if (req.user.role === 'caregiver') throw new AppError('Caregivers cannot add health logs', 403);
    const log = await HealthLog.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

export const updateHealthLog = async (req, res, next) => {
  try {
    const log = await HealthLog.findById(req.params.id);
    if (!log || log.user.toString() !== req.user._id.toString()) {
      throw new AppError('Log not found', 404);
    }
    Object.assign(log, req.body);
    await log.save();
    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

export const deleteHealthLog = async (req, res, next) => {
  try {
    const log = await HealthLog.findById(req.params.id);
    if (!log || log.user.toString() !== req.user._id.toString()) {
      throw new AppError('Log not found', 404);
    }
    await log.deleteOne();
    res.json({ success: true, message: 'Log deleted' });
  } catch (err) {
    next(err);
  }
};

export const getHealthSummary = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const latest = await HealthLog.findOne({ user: userId }).sort({ date: -1 });
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekLogs = await HealthLog.find({ user: userId, date: { $gte: weekAgo } }).sort({ date: 1 });
    res.json({ success: true, latest, weekLogs });
  } catch (err) {
    next(err);
  }
};
