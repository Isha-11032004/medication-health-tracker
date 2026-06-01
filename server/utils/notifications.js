import Notification from '../models/Notification.js';
import { sendEmail } from './email.js';
import User from '../models/User.js';

export const createNotification = async (userId, { type, title, message, relatedId, relatedModel }) => {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    relatedId,
    relatedModel,
  });
  return notification;
};

export const notifyUserWithEmail = async (userId, payload) => {
  const notification = await createNotification(userId, payload);
  const user = await User.findById(userId).select('email name');
  if (user?.email) {
    await sendEmail({
      to: user.email,
      subject: payload.title,
      html: `<p>Hi ${user.name},</p><p>${payload.message}</p>`,
    });
  }
  return notification;
};
