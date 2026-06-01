import User from '../models/User.js';
import CaregiverInvite from '../models/CaregiverInvite.js';
import { sendEmail } from '../utils/email.js';
import { createNotification } from '../utils/notifications.js';
import { AppError } from '../middleware/errorHandler.js';

export const inviteCaregiver = async (req, res, next) => {
  try {
    if (req.user.role !== 'patient') {
      throw new AppError('Only patients can invite caregivers', 403);
    }
    const { email } = req.body;
    if (!email) throw new AppError('Caregiver email required');

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && req.user.caregivers?.includes(existing._id)) {
      throw new AppError('Already linked to this caregiver');
    }

    const token = CaregiverInvite.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await CaregiverInvite.deleteMany({
      patient: req.user._id,
      caregiverEmail: email.toLowerCase(),
      status: 'pending',
    });

    const invite = await CaregiverInvite.create({
      patient: req.user._id,
      caregiverEmail: email.toLowerCase(),
      token,
      expiresAt,
    });

    const acceptUrl = `${process.env.CLIENT_URL}/accept-invite?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Caregiver invitation - Medication Health Tracker',
      html: `<p>You have been invited to be a caregiver on Medication Health Tracker.</p>
             <p><a href="${acceptUrl}">Accept invitation</a></p>
             <p>Link expires in 7 days.</p>`,
    });

    res.status(201).json({ success: true, message: 'Invitation sent', inviteId: invite._id });
  } catch (err) {
    next(err);
  }
};

export const acceptInvite = async (req, res, next) => {
  try {
    const { token } = req.body;
    const invite = await CaregiverInvite.findOne({ token, status: 'pending' });
    if (!invite) throw new AppError('Invalid or expired invitation', 400);
    if (new Date() > invite.expiresAt) {
      invite.status = 'declined';
      await invite.save();
      throw new AppError('Invitation expired', 400);
    }

    if (req.user.email.toLowerCase() !== invite.caregiverEmail) {
      throw new AppError('This invitation was sent to a different email', 403);
    }

    const patient = await User.findById(invite.patient);
    if (!patient) throw new AppError('Patient not found', 404);

    if (!patient.caregivers.includes(req.user._id)) {
      patient.caregivers.push(req.user._id);
      await patient.save();
    }
    if (!req.user.linkedPatients.includes(patient._id)) {
      req.user.linkedPatients.push(patient._id);
      req.user.role = 'caregiver';
      await req.user.save();
    }

    invite.status = 'accepted';
    await invite.save();

    await createNotification(patient._id, {
      type: 'caregiver',
      title: 'Caregiver connected',
      message: `${req.user.name} accepted your caregiver invitation`,
    });

    res.json({ success: true, message: 'You are now linked as caregiver', patient: { id: patient._id, name: patient.name } });
  } catch (err) {
    next(err);
  }
};

export const getLinkedPatients = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('linkedPatients', 'name email');
    res.json({ success: true, patients: user.linkedPatients || [] });
  } catch (err) {
    next(err);
  }
};

export const removeCaregiver = async (req, res, next) => {
  try {
    const { caregiverId } = req.params;
    const patient = await User.findById(req.user._id);
    patient.caregivers = patient.caregivers.filter((id) => id.toString() !== caregiverId);
    await patient.save();

    const caregiver = await User.findById(caregiverId);
    if (caregiver) {
      caregiver.linkedPatients = caregiver.linkedPatients.filter(
        (id) => id.toString() !== patient._id.toString()
      );
      await caregiver.save();
    }
    res.json({ success: true, message: 'Caregiver removed' });
  } catch (err) {
    next(err);
  }
};
