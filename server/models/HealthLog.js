import mongoose from 'mongoose';

const healthLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, default: Date.now },
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
    },
    sugarLevel: Number,
    weight: Number,
    notes: String,
  },
  { timestamps: true }
);

healthLogSchema.index({ user: 1, date: -1 });

export default mongoose.model('HealthLog', healthLogSchema);
