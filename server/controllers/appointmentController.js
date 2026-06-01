import Appointment from '../models/Appointment.js';
import { resolveUserId } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const ensureOwnership = async (id, userId, user) => {
  const apt = await Appointment.findById(id);
  if (!apt) throw new AppError('Appointment not found', 404);
  if (user.role === 'caregiver') {
    const linked = user.linkedPatients?.map((p) => p.toString()) || [];
    if (!linked.includes(apt.user.toString())) throw new AppError('Access denied', 403);
  } else if (apt.user.toString() !== userId.toString()) {
    throw new AppError('Access denied', 403);
  }
  return apt;
};

export const getAppointments = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const appointments = await Appointment.find({ user: userId }).sort({ date: 1 });
    res.json({ success: true, appointments });
  } catch (err) {
    next(err);
  }
};

export const getUpcoming = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const appointments = await Appointment.find({ user: userId, date: { $gte: now } })
      .sort({ date: 1 })
      .limit(5);
    res.json({ success: true, appointments });
  } catch (err) {
    next(err);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    if (req.user.role === 'caregiver') throw new AppError('Caregivers cannot create appointments', 403);
    const apt = await Appointment.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, appointment: apt });
  } catch (err) {
    next(err);
  }
};

export const updateAppointment = async (req, res, next) => {
  try {
    const apt = await ensureOwnership(req.params.id, req.user._id, req.user);
    if (req.user.role === 'caregiver') throw new AppError('Caregivers cannot edit appointments', 403);
    Object.assign(apt, req.body);
    await apt.save();
    res.json({ success: true, appointment: apt });
  } catch (err) {
    next(err);
  }
};

export const deleteAppointment = async (req, res, next) => {
  try {
    const apt = await ensureOwnership(req.params.id, req.user._id, req.user);
    if (req.user.role === 'caregiver') throw new AppError('Caregivers cannot delete appointments', 403);
    await apt.deleteOne();
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (err) {
    next(err);
  }
};
