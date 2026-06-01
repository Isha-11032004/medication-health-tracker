import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['patient', 'caregiver'], default: 'patient' },
    // Patients this caregiver is linked to (caregiver role only)
    linkedPatients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Caregivers linked to this patient (patient role only)
    caregivers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    darkMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
