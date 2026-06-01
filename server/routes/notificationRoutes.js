import express from 'express';
import { getNotifications, markRead, markAllRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

export default router;
