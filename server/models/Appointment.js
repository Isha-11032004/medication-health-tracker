import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorName: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: String,
    notes: String,
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Appointment', appointmentSchema);
