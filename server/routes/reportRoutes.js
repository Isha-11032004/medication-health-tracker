import express from 'express';
import { getAnalytics, getWeeklyAdherence, exportCSV, exportPDF } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/analytics', getAnalytics);
router.get('/weekly-adherence', getWeeklyAdherence);
router.get('/export/csv', exportCSV);
router.get('/export/pdf', exportPDF);

export default router;
