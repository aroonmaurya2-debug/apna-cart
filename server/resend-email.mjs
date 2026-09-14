// Email helper for Apna Cart.
// Secrets must stay in Render Environment Variables only.

import nodemailer from 'nodemailer'

const RESEND_API = 'https://api.resend.com/emails'

const hasSmtpConfig = () => Boolean(
  process.env.SMTP_USER &&
  process.env.SMTP_PASS,
)

export const isResendConfigured = () => Boolean(
  process.env.RESEND_API_KEY || hasSmtpConfig(),
)

const sendWithSmtp = async ({ to, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  })

  return Boolean(info?.messageId)
}

const sendWithResend = async ({ to, subject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false

  const response = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to: [to],
      subject,
      text,
      ...(html ? { html } : {}),
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || `Resend email failed: ${response.status}`)
  }

  return Boolean(payload?.id)
}

export const sendResendEmail = async ({ to, subject, text, html }) => {
  // Prefer SMTP when configured. This prevents an old/invalid Resend key from
  // breaking OTP delivery when a working SMTP account is available.
  if (hasSmtpConfig()) return sendWithSmtp({ to, subject, text, html })
  return sendWithResend({ to, subject, text, html })
}
