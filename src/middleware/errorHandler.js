export function errorHandler(err, req, res, next) {
  if (err.code === '23505') {
    if (err.constraint === 'logs_habit_id_logged_date_key') {
      return res.status(409).json({
        success: false,
        message: 'Habit already logged today',
      });
    }
    return res.status(409).json({
      success: false,
      message: 'This record already exists',
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference — related record does not exist',
    });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Server error',
  });
}

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}