import mongoose from 'mongoose';
import crypto from 'crypto';

const caregiverInviteSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    caregiverEmail: { type: String, required: true, lowercase: true },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

caregiverInviteSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

export default mongoose.model('CaregiverInvite', caregiverInviteSchema);
