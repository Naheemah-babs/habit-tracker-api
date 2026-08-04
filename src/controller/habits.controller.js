import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

export async function createHabit(req, res, next) {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      `INSERT INTO habits (user_id, name)
       VALUES ($1, $2)
       RETURNING id, name, current_streak, longest_streak, last_logged_date, created_at`,
      [userId, name]
    );

    res.status(201).json({ success: true, habit: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function getHabits(req, res, next) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, name, current_streak, longest_streak, last_logged_date, created_at
       FROM habits
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({ success: true, habits: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function getHabitById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, current_streak, longest_streak, last_logged_date, created_at
       FROM habits
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Habit not found', 404));
    }

    res.status(200).json({ success: true, habit: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteHabit(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Habit not found', 404));
    }

    res.status(200).json({ success: true, message: 'Habit deleted' });
  } catch (err) {
    next(err);
  }
}