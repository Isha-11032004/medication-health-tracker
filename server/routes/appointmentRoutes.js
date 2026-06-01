import express from 'express';
import {
  getAppointments,
  getUpcoming,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', getAppointments);
router.get('/upcoming', getUpcoming);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
