import express from 'express';
import {
  getMedications,
  getTodayMedications,
  createMedication,
  updateMedication,
  deleteMedication,
  logDose,
  getAdherenceLogs,
} from '../controllers/medicationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', getMedications);
router.get('/today', getTodayMedications);
router.get('/logs', getAdherenceLogs);
router.post('/', createMedication);
router.put('/:id', updateMedication);
router.delete('/:id', deleteMedication);
router.post('/:id/dose', logDose);

export default router;
