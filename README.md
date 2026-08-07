# Habit Tracker API

A production-track REST API for tracking daily habits and calculating streaks, built with Node.js, Express, and PostgreSQL. Includes JWT authentication with email verification, streak calculation with concurrency safety, automated email reminders, and role-based access control.

## Features

- **Authentication** — JWT-based auth with bcrypt password hashing
- **Email verification** — new accounts must verify their email (via a Resend-sent link) before they can create or log habits
- **Habit tracking** — create, list, view, and delete personal habits
- **Streak logic** — automatically calculates current and longest streaks based on daily logs, correctly handling first-time logs, same-day duplicates, consecutive-day continuation, and streak resets after a missed day
- **Concurrency-safe logging** — habit logs are written inside a database transaction with row-level locking (`SELECT ... FOR UPDATE`) to prevent race conditions on rapid duplicate requests, backed by a `UNIQUE(habit_id, logged_date)` database constraint as a final safety net
- **Email reminders** — a daily cron job (node-cron) checks which users have unlogged habits and sends a single digest reminder email per user via Resend
- **Role-based access control** — an `admin` role gates a manual reminder-trigger endpoint, separate from regular user access
- **Scoped data access** — every query is scoped by the authenticated user's ID; users can never view or modify another user's habits or logs
- **Input validation** — request validation via `express-validator`
- **Centralized error handling** — a single error-handling middleware converts thrown errors and raw Postgres errors (e.g. unique/foreign key violations) into consistent, clean JSON responses
- **UUID primary keys** — all tables use `gen_random_uuid()` rather than sequential IDs, to avoid exposing record counts or making IDs guessable in URLs

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** PostgreSQL (raw SQL via `pg`, no ORM)
- **Auth:** JWT + bcrypt
- **Email service:** Resend
- **Scheduling:** node-cron
- **Validation:** express-validator

## Project Structure

```
src/
  config/         # database connection (pg pool)
  controller/     # request handlers / business logic
  middleware/     # auth, admin, email-verification gate, validation, error handling
  routes/         # route definitions
  jobs/           # scheduled background jobs (reminder cron)
  utils/          # streak calculation, email sending, token generation, reminder query
  server.js       # app entry point
migrations/       # numbered SQL migration files
scripts/
  run-migrations.js  # applies pending migrations, tracked in a "Migrations" table
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v13+ recommended, for built-in `pgcrypto`/`gen_random_uuid()` support)
- A [Resend](https://resend.com) account and API key (free, no card required for test mode)

### Installation

```bash
git clone https://github.com/Naheemah-babs/habit-tracker-api.git
cd habit-tracker-api
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```
PORT=5000
DATABASE_URL=postgres://username:password@localhost:5432/habit_tracker
JWT_SECRET=your_long_random_secret
RESEND_API_KEY=your_resend_api_key
APP_BASE_URL=http://localhost:5000
NODE_ENV=development
```

Generate a strong `JWT_SECRET` with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Database Setup

Create the database, then run the migration script (tracks applied migrations in a `Migrations` table, so it's safe to re-run):

```bash
createdb habit_tracker
npm run migrate
```



### Run the server

```bash
npm run dev
```

Server runs on `http://localhost:5000` by default.

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user, sends a verification email |
| GET | `/api/auth/verify?token=...` | Verify email using the token from the verification email |
| POST | `/api/auth/login` | Log in and receive a JWT |

### Habits *(requires auth + verified email)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/habits` | Create a new habit |
| GET | `/api/habits` | List all habits for the logged-in user |
| GET | `/api/habits/:id` | Get a single habit by ID (scoped to the owner) |
| DELETE | `/api/habits/:id` | Delete a habit |

### Logs *(requires auth + verified email)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/habits/:id/logs` | Log a habit for today; recalculates current/longest streak |
| GET | `/api/habits/:id/logs` | View log history for a habit |

### Admin *(requires auth + `admin` role)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/habits/test-reminder-job` | Manually triggers the reminder job on demand and returns per-user send results |

## Streak Logic

Each habit stores `current_streak`, `longest_streak`, and `last_logged_date` directly (rather than recalculating from the full log history on every read). When a habit is logged:

- **No prior log** → `current_streak` starts at `1`
- **Already logged today** → rejected with `409 Habit already logged today`
- **Last logged yesterday** → `current_streak` increments
- **Last logged 2+ days ago** → `current_streak` resets to `1` (streak broken)
- `longest_streak` is updated whenever `current_streak` exceeds it, and is never decreased

## Email Verification Flow

1. On `POST /api/auth/register`, a random token and 24-hour expiry are generated and stored on the user, and a verification email is sent via Resend
2. Until verified, the user's JWT is valid for login, but the `requireVerified` middleware blocks all habit/log routes with `403 Please verify your email before continuing`
3. `GET /api/auth/verify?token=...` checks the token against the stored value and expiry, marks `email_verified = true`, and clears the token fields

## Reminder Job

- Runs daily at 6:00 PM server time via `node-cron`
- Queries for users with at least one habit where `last_logged_date IS DISTINCT FROM CURRENT_DATE` (correctly includes habits that have never been logged, i.e. `NULL`, which a plain `!=` comparison would miss)
- Sends one digest email per user listing all their unlogged habits for the day
- Can be triggered manually via the admin-only `GET /api/habits/test-reminder-job` endpoint

## Database Schema

**users** — `id (UUID)`, `email`, `password_hash`, `name`, `role`, `email_verified`, `verification_token`, `verification_token_expires`, `created_at`

**habits** — `id (UUID)`, `user_id (FK → users, cascade delete)`, `name`, `current_streak`, `longest_streak`, `last_logged_date`, `created_at`

**logs** — `id (UUID)`, `habit_id (FK → habits, cascade delete)`, `logged_date`, `created_at`, unique on `(habit_id, logged_date)`


## Author

Built by Naheemot Babatunde.