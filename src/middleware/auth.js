import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { AppError } from './errorHandler.js';

export async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Not authorized, no token', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query('SELECT id, role FROM users WHERE id = $1', [decoded.id]);

    if (result.rows.length === 0) {
      return next(new AppError('User no longer exists', 401));
    }

    req.user = { id: result.rows[0].id, role: result.rows[0].role };
    next();
  } catch (err) {
    next(new AppError('Not authorized, token invalid', 401));
  }
}