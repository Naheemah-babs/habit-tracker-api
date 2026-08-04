import cron from 'node-cron';
import { getUsersNeedingReminders } from '../utils/reminderQuery.js';
import { sendReminderEmail } from '../utils/email.js';

export function startReminderJob() {
  cron.schedule('0 18 * * *', async () => {
    const users = await getUsersNeedingReminders();
    const results = [];

    for (const user of users) {
      const result = await sendReminderEmail(user.email, user.name, user.unlogged_habits);
      results.push(result);
    }

    return results;
  });
}