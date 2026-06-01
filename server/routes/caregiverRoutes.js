import express from 'express';
import {
  inviteCaregiver,
  acceptInvite,
  getLinkedPatients,
  removeCaregiver,
} from '../controllers/caregiverController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.post('/invite', inviteCaregiver);
router.post('/accept', acceptInvite);
router.get('/patients', getLinkedPatients);
router.delete('/:caregiverId', removeCaregiver);

export default router;
