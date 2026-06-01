import express from 'express';
import {
  getHealthLogs,
  createHealthLog,
  updateHealthLog,
  deleteHealthLog,
  getHealthSummary,
} from '../controllers/healthController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', getHealthLogs);
router.get('/summary', getHealthSummary);
router.post('/', createHealthLog);
router.put('/:id', updateHealthLog);
router.delete('/:id', deleteHealthLog);

export default router;
