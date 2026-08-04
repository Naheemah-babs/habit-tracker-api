import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/admin.js';
import { getUsersNeedingReminders } from '../utils/reminderQuery.js';
import { sendReminderEmail } from '../utils/email.js';
import {
  createHabit,
  getHabits,
  getHabitById,
  deleteHabit,
} from '../controller/habits.controller.js';

const router = Router();

router.use(protect); 

router.post(
  '/',
  [body('name').notEmpty().withMessage('Habit name is required')],
  validate,
  createHabit
);

router.get('/', getHabits);

router.get('/test-reminder-job', requireAdmin, async (req, res, next) => {
  try {
    const users = await getUsersNeedingReminders();
    const results = [];
    for (const user of users) {
      results.push(await sendReminderEmail(user.email, user.name, user.unlogged_habits));
    }
    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', getHabitById);
router.delete('/:id', deleteHabit);

export default router;