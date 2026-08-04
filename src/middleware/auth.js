import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Not authorized, no token', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // attach user id to request
    next();
  } catch (err) {
    next(new AppError('Not authorized, token invalid', 401));
  }
}