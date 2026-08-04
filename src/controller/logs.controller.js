import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { calculateStreak } from '../utils/streak.js';

export async function logHabit(req, res, next) {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { id: habitId } = req.params; // habit id from URL: POST /api/habits/:id/logs

    // today's date as YYYY-MM-DD (matches Postgres DATE type)
    const today = new Date().toISOString().split('T')[0];

    await client.query('BEGIN');

    // fetch habit, make sure it belongs to this user
    const habitResult = await client.query(
      `SELECT id, current_streak, longest_streak, last_logged_date
       FROM habits WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [habitId, userId]
    );

    if (habitResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return next(new AppError('Habit not found', 404));
    }

    const habit = habitResult.rows[0];

    const { newCurrentStreak, isDuplicate } = calculateStreak(
      habit.last_logged_date,
      habit.current_streak,
      today
    );

    if (isDuplicate) {
      await client.query('ROLLBACK');
      return next(new AppError('Habit already logged today', 409));
    }

    const newLongestStreak = Math.max(newCurrentStreak, habit.longest_streak);

    // insert the log entry
    await client.query(
      `INSERT INTO logs (habit_id, logged_date) VALUES ($1, $2)`,
      [habitId, today]
    );

    // update the habit's cached streak fields
    const updateResult = await client.query(
      `UPDATE habits
       SET current_streak = $1, longest_streak = $2, last_logged_date = $3
       WHERE id = $4
       RETURNING id, name, current_streak, longest_streak, last_logged_date`,
      [newCurrentStreak, newLongestStreak, today, habitId]
    );

    await client.query('COMMIT');

    res.status(201).json({ success: true, habit: updateResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function getLogsForHabit(req, res, next) {
  try {
    const userId = req.user.id;
    const { id: habitId } = req.params;

    // confirm the habit belongs to this user first
    const habitCheck = await pool.query(
      `SELECT id FROM habits WHERE id = $1 AND user_id = $2`,
      [habitId, userId]
    );

    if (habitCheck.rows.length === 0) {
      return next(new AppError('Habit not found', 404));
    }

    const result = await pool.query(
      `SELECT id, logged_date, created_at
       FROM logs
       WHERE habit_id = $1
       ORDER BY logged_date DESC`,
      [habitId]
    );

    res.status(200).json({ success: true, logs: result.rows });
  } catch (err) {
    next(err);
  }
}