import { AppError } from './errorHandler.js';

export function requireVerified(req, res, next) {
  if (!req.user.email_verified) {
    return next(new AppError('Please verify your email before continuing', 403));
  }
  next();
}