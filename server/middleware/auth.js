import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Verify JWT and attach user to request
 */
export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/** Restrict to specific roles */
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};

/**
 * Ensure caregiver can only access linked patient data
 */
export const canAccessPatient = (patientIdParam = 'patientId') => async (req, res, next) => {
  const patientId = req.params[patientIdParam] || req.body.patientId || req.query.patientId;

  if (req.user.role === 'patient' && req.user._id.toString() === patientId) {
    return next();
  }

  if (req.user.role === 'caregiver') {
    const linked = req.user.linkedPatients?.map((id) => id.toString()) || [];
    if (patientId && linked.includes(patientId)) {
      req.patientId = patientId;
      return next();
    }
    // Caregiver viewing own dashboard without patientId — use first linked or self
    if (!patientId) return next();
  }

  if (!patientId || req.user._id.toString() === patientId) {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Cannot access this patient data' });
};

/** Resolve effective user ID (patient) for queries */
export const resolveUserId = (req) => {
  if (req.user.role === 'caregiver' && req.query.patientId) {
    const linked = req.user.linkedPatients?.map((id) => id.toString()) || [];
    if (linked.includes(req.query.patientId)) return req.query.patientId;
  }
  return req.user._id.toString();
};
