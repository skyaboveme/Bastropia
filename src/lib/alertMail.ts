import { siteUrl } from '../data/site';

export type AlertMail = {
  to: string;
  subject: string;
  text: string;
};

function fromAddress() {
  return process.env.RESEND_FROM?.trim() || 'Bastropia Alerts <alerts@bastropia.com>';
}

/** Fan-out status emails through Resend. Soft-fails when the key is missing. */
export async function sendAlertMails(messages: AlertMail[]) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || !messages.length) return { sent: 0, skipped: messages.length };

  let sent = 0;
  for (const message of messages) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${key}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress(),
          to: [message.to],
          subject: message.subject,
          text: `${message.text}\n\n—\nBastropia status alert · ${siteUrl}/alerts\nConfirm on the official pages linked above. This is not 911.`,
        }),
      });
      if (response.ok) sent += 1;
    } catch {
      /* Keep going so one bad address does not stop the batch. */
    }
  }
  return { sent, skipped: messages.length - sent };
}
