import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
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
router.get('/:id', getHabitById);
router.delete('/:id', deleteHabit);

export default router;