import mongoose from 'mongoose';

const doseLogSchema = new mongoose.Schema(
  {
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: ['taken', 'missed', 'pending'], default: 'pending' },
    takenAt: Date,
    notes: String,
  },
  { _id: true }
);

const medicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true },
    frequency: {
      type: String,
      enum: ['once_daily', 'twice_daily', 'three_times', 'custom'],
      default: 'once_daily',
    },
    times: [{ type: String, required: true }], // e.g. ["08:00", "20:00"]
    startDate: { type: Date, required: true },
    endDate: Date,
    instructions: String,
    active: { type: Boolean, default: true },
    doseLogs: [doseLogSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Medication', medicationSchema);
