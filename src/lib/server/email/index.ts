import { render } from '@react-email/components';
import { createMessage } from '@upyo/core';
import { SmtpTransport } from '@upyo/smtp';
import { env } from '$env/dynamic/private';
import type { ReactElement } from 'react';

const transport = new SmtpTransport({
  host: env.SMTP_HOST,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
  secure: false,
});

type SendEmailParams = {
  subject: string;
  recipient: string;
  body: ReactElement;
};

export const sendEmail = async ({ subject, recipient, body }: SendEmailParams) => {
  console.log('transport', transport.config);

  const email = createMessage({
    from: 'Byulmaru ID <noreply@byulmaru.co>',
    to: recipient,
    subject,
    content: { html: await render(body) },
  });

  await transport.send(email);
};
