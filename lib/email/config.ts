const splitEmails = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export function getEmailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY ?? "",
    appUrl: process.env.APP_URL ?? "",
    fromEmail: process.env.RESEND_FROM_EMAIL ?? "",
    fromName: process.env.RESEND_FROM_NAME ?? "Omborokko Safaris",
    adminEmails: splitEmails(process.env.BOOKING_ADMIN_EMAILS),
    replyToEmail: process.env.BOOKING_REPLY_TO_EMAIL ?? ""
  };
}

export function isEmailEnabled() {
  const config = getEmailConfig();

  return Boolean(config.apiKey && config.fromEmail);
}
