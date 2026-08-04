import pool from '../config/db.js';

export async function getUsersNeedingReminders() {
  const result = await pool.query(`
    SELECT 
      u.id AS user_id,
      u.email,
      u.name,
      json_agg(h.name) AS unlogged_habits
    FROM users u
    JOIN habits h ON h.user_id = u.id
    WHERE h.last_logged_date IS DISTINCT FROM CURRENT_DATE
    GROUP BY u.id, u.email, u.name
  `);

  return result.rows;
}