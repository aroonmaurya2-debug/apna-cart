// Resend email helper for Apna Cart.
// Keep the Resend API key on the server/Render environment only.

const RESEND_API = 'https://api.resend.com/emails'

export const isResendConfigured = () => Boolean(process.env.RESEND_API_KEY || process.env.SMTP_PASS)

export const sendResendEmail = async ({ to, subject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY || process.env.SMTP_PASS
  if (!apiKey) return false

  const response = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || process.env.SMTP_FROM || 'onboarding@resend.dev',
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
