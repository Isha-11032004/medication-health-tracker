import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { AppError } from '../middleware/errorHandler.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      throw new AppError('Please provide name, email and password');
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) throw new AppError('Email already registered', 400);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: role === 'caregiver' ? 'caregiver' : 'patient',
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        darkMode: user.darkMode,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Please enter email and password', 400);
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        darkMode: user.darkMode,
        linkedPatients: user.linkedPatients,
        caregivers: user.caregivers,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('linkedPatients', 'name email')
      .populate('caregivers', 'name email');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, darkMode } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (typeof darkMode === 'boolean') user.darkMode = darkMode;
    await user.save();
    res.json({ success: true, user: { id: user._id, name: user.name, darkMode: user.darkMode } });
  } catch (err) {
    next(err);
  }
};
