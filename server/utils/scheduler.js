import cron from 'node-cron';
import Medication from '../models/Medication.js';
import Appointment from '../models/Appointment.js';
import { notifyUserWithEmail } from './notifications.js';

/** Parse HH:mm to today's Date */
const timeToToday = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

/** Check if medication is active on given date */
const isActiveOnDate = (med, date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const start = new Date(med.startDate);
  start.setHours(0, 0, 0, 0);
  if (day < start) return false;
  if (med.endDate) {
    const end = new Date(med.endDate);
    end.setHours(23, 59, 59, 999);
    if (day > end) return false;
  }
  return med.active;
};

/**
 * Every minute: medication reminders & mark missed doses
 */
const processMedicationReminders = async () => {
  const now = new Date();
  const meds = await Medication.find({ active: true }).populate('user', 'email name');

  for (const med of meds) {
    if (!isActiveOnDate(med, now)) continue;

    for (const timeStr of med.times) {
      const scheduled = timeToToday(timeStr);
      const diffMs = now - scheduled;
      const windowMs = 60 * 1000;

      if (diffMs >= 0 && diffMs < windowMs) {
        const exists = med.doseLogs?.some(
          (log) =>
            log.scheduledAt &&
            new Date(log.scheduledAt).getTime() === scheduled.getTime()
        );
        if (!exists) {
          med.doseLogs.push({ scheduledAt: scheduled, status: 'pending' });
          await med.save();
          await notifyUserWithEmail(med.user._id, {
            type: 'medication',
            title: 'Medication Reminder',
            message: `Time to take ${med.name} (${med.dosage})`,
            relatedId: med._id,
            relatedModel: 'Medication',
          });
        }
      }

      if (diffMs > 30 * 60 * 1000 && diffMs < 31 * 60 * 1000) {
        const log = med.doseLogs?.find(
          (l) =>
            new Date(l.scheduledAt).getTime() === scheduled.getTime() &&
            l.status === 'pending'
        );
        if (log) {
          log.status = 'missed';
          await med.save();
        }
      }
    }
  }
};

const processAppointmentReminders = async () => {
  const now = new Date();
  const appointments = await Appointment.find({
    date: { $gte: now },
    reminderSent: false,
  }).populate('user', 'email name');

  for (const apt of appointments) {
    const [h, m] = apt.time.split(':').map(Number);
    const aptDate = new Date(apt.date);
    aptDate.setHours(h, m, 0, 0);
    const hoursUntil = (aptDate - now) / (1000 * 60 * 60);

    if (hoursUntil <= 24 && hoursUntil > 23) {
      await notifyUserWithEmail(apt.user._id, {
        type: 'appointment',
        title: 'Appointment Tomorrow',
        message: `Reminder: ${apt.doctorName} on ${aptDate.toLocaleDateString()} at ${apt.time}`,
        relatedId: apt._id,
        relatedModel: 'Appointment',
      });
      apt.reminderSent = true;
      await apt.save();
    }
  }
};

export const startScheduler = () => {
  cron.schedule('* * * * *', async () => {
    try {
      await processMedicationReminders();
      await processAppointmentReminders();
    } catch (err) {
      console.error('Scheduler error:', err);
    }
  });
  console.log('Reminder scheduler started (every minute)');
};
