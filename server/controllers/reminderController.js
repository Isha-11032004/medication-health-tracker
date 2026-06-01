import Medication from '../models/Medication.js';
import Appointment from '../models/Appointment.js';
import { resolveUserId } from '../middleware/auth.js';
import { normalizeTime } from '../utils/doseStats.js';

/** Upcoming medication times & appointments for client alarm scheduler */
export const getUpcomingReminders = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 2);

    const meds = await Medication.find({ user: userId, active: true });
    const appointments = await Appointment.find({
      user: userId,
      date: { $gte: today, $lt: tomorrow },
    }).sort({ date: 1 });

    const medicationSlots = [];
    meds.forEach((m) => {
      const start = new Date(m.startDate);
      start.setHours(0, 0, 0, 0);
      if (today < start) return;
      if (m.endDate) {
        const end = new Date(m.endDate);
        end.setHours(23, 59, 59, 999);
        if (today > end) return;
      }
      (m.times || []).forEach((t) => {
        const time = normalizeTime(t);
        const [hh, mm] = time.split(':').map(Number);
        const at = new Date(today);
        at.setHours(hh, mm, 0, 0);
        medicationSlots.push({
          medicationId: m._id,
          name: m.name,
          dosage: m.dosage,
          time,
          scheduledAt: at,
        });
      });
    });

    const aptList = appointments.map((a) => ({
      appointmentId: a._id,
      doctorName: a.doctorName,
      location: a.location,
      time: normalizeTime(a.time),
      date: a.date,
    }));

    res.json({
      success: true,
      reminders: {
        medications: medicationSlots,
        appointments: aptList,
      },
    });
  } catch (err) {
    next(err);
  }
};
