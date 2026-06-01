import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['medication', 'appointment', 'caregiver', 'system'],
      default: 'system',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedId: mongoose.Schema.Types.ObjectId,
    relatedModel: String,
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
