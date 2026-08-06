import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireVerified } from '../middleware/requireVerified.js';
import { logHabit, getLogsForHabit } from '../controller/logs.controller.js';

const router = Router({ mergeParams: true });

router.use(protect);
router.use(requireVerified);

router.post('/:id/logs', logHabit);
router.get('/:id/logs', getLogsForHabit);

export default router;