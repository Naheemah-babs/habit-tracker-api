import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import habitsRoutes from './routes/habits.routes.js';
import logsRoutes from './routes/logs.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startReminderJob } from './jobs/reminderJob.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/habits', logsRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
startReminderJob();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
