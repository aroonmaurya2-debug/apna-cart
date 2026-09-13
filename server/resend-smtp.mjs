// Bridge Resend's API key to the existing Nodemailer SMTP sender.
// Keep RESEND_API_KEY only in Render Environment Variables, never in GitHub.

if (process.env.RESEND_API_KEY) {
  process.env.SMTP_HOST ||= 'smtp.resend.com'
  process.env.SMTP_PORT ||= '465'
  process.env.SMTP_SECURE ||= 'true'
  process.env.SMTP_USER ||= 'resend'
  process.env.SMTP_PASS ||= process.env.RESEND_API_KEY
  process.env.SMTP_FROM ||= process.env.RESEND_FROM || 'onboarding@resend.dev'
}
