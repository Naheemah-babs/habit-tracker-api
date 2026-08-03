# Habit Tracker API
A REST API for tracking daily habits and calculating streaks, built with Node.js, Express, and PostgreSQL. Includes secure authentication, streak logic, and automated email reminders for missed habits.

## Features

- **Authentication** — JWT-based auth with bcrypt password hashing
- **Habit tracking** — create, list, and manage personal habits
- **Streak logic** — automatically calculates current and longest streaks based on daily logs
- **Email reminders** — sends a reminder via Resend/SendGrid if a habit hasn't been logged for the day
- **Scoped data access** — every user only sees and modifies their own habits and logs
- **Input validation** — request validation via `express-validator`
- **Centralized error handling** — consistent error responses across the API

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** PostgreSQL
- **Auth:** JWT + bcrypt
- **Email service:** Resend
- **Scheduling:** node-cron
- **Validation:** express-validator

## Project Structure
src/
config/ # database connection
controllers/ # request handlers / business logic
middleware/ # auth, validation, error handling
routes/ # route definitions
utils/ # streak calculation, helpers
server.js # app entry point
db/
schema.sql # database schema

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL

### Installation

```bash
git clone 
cd habit-tracker-api
npm install
```

### Environment Variables

Create a `.env` file in the root directory:
PORT=5000
DATABASE_URL=postgres://username:password@localhost:5432/habit_tracker
JWT_SECRET=your_long_random_secret
RESEND_API_KEY=your_resend_api_key
NODE_ENV=development

### Database Setup

```bash
createdb habit_tracker
psql habit_tracker -f db/schema.sql
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
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in and receive a JWT |

### Habits *(requires auth)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/habits` | Create a new habit |
| GET | `/api/habits` | List all habits for the logged-in user |
| DELETE | `/api/habits/:id` | Delete a habit |

### Logs *(requires auth)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/habits/:id/logs` | Log a habit for today, updates streak |
| GET | `/api/habits/:id/logs` | View log history for a habit |


## Database Schema

**users** — id, email, password_hash, name, created_at

**habits** — id, user_id, name, current_streak, longest_streak, last_logged_date, created_at

**logs** — id, habit_id, logged_date, created_at


## Author

Built by Naheemot Babatunde.
