import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReminderEmail(toEmail, userName, habitNames) {
  const habitList = habitNames.map(name => `<li>${name}</li>`).join('');

  const { data, error } = await resend.emails.send({
    from: 'Habit Tracker <onboarding@resend.dev>',
    to: toEmail,
    subject: `Reminder: ${habitNames.length} habit${habitNames.length > 1 ? 's' : ''} still waiting today`,
    html: `
      <p>Hi ${userName || 'there'},</p>
      <p>You haven't logged the following habit${habitNames.length > 1 ? 's' : ''} today:</p>
      <ul>${habitList}</ul>
      <p>Keep your streak alive!</p>
    `,
  });

  return { success: !error, email: toEmail, error: error?.message };
}