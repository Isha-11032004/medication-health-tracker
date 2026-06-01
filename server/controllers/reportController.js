import PDFDocument from 'pdfkit';
import Medication from '../models/Medication.js';
import HealthLog from '../models/HealthLog.js';
import { resolveUserId } from '../middleware/auth.js';
export const getAnalytics = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const meds = await Medication.find({ user: userId });
    let taken = 0;
    let missed = 0;
    let pending = 0;

    meds.forEach((m) => {
      m.doseLogs.forEach((l) => {
        if (l.status === 'taken') taken++;
        else if (l.status === 'missed') missed++;
        else pending++;
      });
    });

    const total = taken + missed + pending;
    const adherencePercent = total > 0 ? Math.round((taken / (taken + missed || 1)) * 100) : 100;

    res.json({
      success: true,
      analytics: {
        taken,
        missed,
        pending,
        total,
        adherencePercent,
        medicationCount: meds.filter((m) => m.active).length,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** Last 7 days adherence for dashboard chart */
export const getWeeklyAdherence = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const meds = await Medication.find({ user: userId, active: true });
    const days = [];
    let totalTaken = 0;
    let totalMissed = 0;
    const missedByPeriod = { morning: 0, afternoon: 0, night: 0 };

    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const end = new Date(day);
      end.setDate(end.getDate() + 1);

      let taken = 0;
      let missed = 0;

      meds.forEach((m) => {
        m.doseLogs.forEach((l) => {
          if (!l.scheduledAt) return;
          const s = new Date(l.scheduledAt);
          if (s < day || s >= end) return;
          if (l.status === 'taken') taken++;
          else if (l.status === 'missed') {
            missed++;
            const h = s.getHours();
            if (h < 12) missedByPeriod.morning++;
            else if (h < 17) missedByPeriod.afternoon++;
            else missedByPeriod.night++;
          }
        });
      });

      totalTaken += taken;
      totalMissed += missed;
      const answered = taken + missed;
      const adherence = answered > 0 ? Math.round((taken / answered) * 100) : 100;

      days.push({
        date: day.toISOString().slice(0, 10),
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        taken,
        missed,
        adherence,
      });
    }

    const weekAnswered = totalTaken + totalMissed;
    const weekPercent = weekAnswered > 0 ? Math.round((totalTaken / weekAnswered) * 100) : 100;

    res.json({
      success: true,
      weekly: {
        days,
        weekAdherencePercent: weekPercent,
        totalTaken,
        totalMissed,
        missedByPeriod,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const exportCSV = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const meds = await Medication.find({ user: userId });
    const rows = [['Medication', 'Dosage', 'Scheduled At', 'Status', 'Taken At', 'Notes']];

    meds.forEach((m) => {
      m.doseLogs.forEach((l) => {
        rows.push([
          m.name,
          m.dosage,
          new Date(l.scheduledAt).toISOString(),
          l.status,
          l.takenAt ? new Date(l.takenAt).toISOString() : '',
          l.notes || '',
        ]);
      });
    });

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=medication-adherence.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

export const exportPDF = async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    const meds = await Medication.find({ user: userId });
    const healthLogs = await HealthLog.find({ user: userId }).sort({ date: -1 }).limit(20);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=health-report.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Medication & Health Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(16).text('Medication Adherence');
    meds.forEach((m) => {
      doc.fontSize(12).text(`${m.name} (${m.dosage})`);
      m.doseLogs.slice(-10).forEach((l) => {
        doc.text(
          `  - ${new Date(l.scheduledAt).toLocaleString()}: ${l.status}${l.takenAt ? ` at ${new Date(l.takenAt).toLocaleString()}` : ''}`
        );
      });
      doc.moveDown(0.5);
    });

    doc.addPage().fontSize(16).text('Recent Health Logs');
    healthLogs.forEach((h) => {
      doc.fontSize(11).text(`${new Date(h.date).toLocaleDateString()}`);
      if (h.bloodPressure?.systolic) {
        doc.text(`  BP: ${h.bloodPressure.systolic}/${h.bloodPressure.diastolic}`);
      }
      if (h.sugarLevel) doc.text(`  Sugar: ${h.sugarLevel}`);
      if (h.weight) doc.text(`  Weight: ${h.weight} kg`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    next(err);
  }
};
