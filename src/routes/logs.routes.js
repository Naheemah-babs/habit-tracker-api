import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { logHabit, getLogsForHabit } from '../controller/logs.controller.js';

const router = Router({ mergeParams: true }); // mergeParams lets us access :id from the parent route

router.use(protect);

router.post('/:id/logs', logHabit);
router.get('/:id/logs', getLogsForHabit);

export default router;