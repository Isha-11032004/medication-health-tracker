import express from 'express';
import { getUpcomingReminders } from '../controllers/reminderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/upcoming', getUpcomingReminders);

export default router;
