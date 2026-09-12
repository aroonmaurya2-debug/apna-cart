// Resend email helper for Apna Cart.
// Keep RESEND_API_KEY on the server/Render environment only.
// Resend's Node.js API is documented at https://resend.com/nodejs

const RESEND_API = 'https://api.resend.com/emails'

export const isResendConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM)

export const sendResendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.RESEND_API_KEY) return false

  const response = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
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
