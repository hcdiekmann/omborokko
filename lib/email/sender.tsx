import * as React from "react";
import { render, toPlainText } from "@react-email/render";
import { Resend } from "resend";

import { getEmailConfig, isEmailEnabled } from "@/lib/email/config";

type SendEmailInput = {
  to: string[];
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput) {
  if (!isEmailEnabled()) {
    console.warn("Email sending skipped because Resend configuration is missing.");
    return;
  }

  const config = getEmailConfig();
  const resend = new Resend(config.apiKey);
  const html = await render(input.react, { pretty: true });
  const text = toPlainText(html);

  const { error } = await resend.emails.send({
    from: `${config.fromName} <${config.fromEmail}>`,
    to: input.to,
    subject: input.subject,
    html,
    text,
    replyTo: input.replyTo
  });

  if (error) {
    throw new Error(error.message);
  }
}
