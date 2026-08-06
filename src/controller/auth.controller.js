import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateVerificationToken } from '../utils/token.js';
import { sendVerificationEmail } from '../utils/email.js';

const SALT_ROUNDS = 10;

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return next(new AppError('Email already in use', 409));
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = generateVerificationToken();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, verification_token, verification_token_expires)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, created_at, email_verified`,
      [email, passwordHash, name, verificationToken, tokenExpires]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    const verificationLink = `${process.env.APP_BASE_URL}/api/auth/verify?token=${verificationToken}`;
    const emailResult = await sendVerificationEmail(email, name, verificationLink);

    res.status(201).json({
      success: true,
      user,
      token,
      emailSent: emailResult.success,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return next(new AppError('Invalid credentials', 401));
    }

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        email_verified: user.email_verified,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;

    if (!token) {
      return next(new AppError('Verification token is required', 400));
    }

    const result = await pool.query(
      `SELECT id, verification_token_expires FROM users WHERE verification_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Invalid or expired verification token', 400));
    }

    const user = result.rows[0];

    if (new Date(user.verification_token_expires) < new Date()) {
      return next(new AppError('Verification token has expired', 400));
    }

    await pool.query(
      `UPDATE users 
       SET email_verified = true, verification_token = NULL, verification_token_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
}