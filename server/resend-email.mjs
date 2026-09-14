// Email helper for Apna Cart.
// Secrets must stay in Render Environment Variables only.
//
// IMPORTANT: Render Free web services block outbound SMTP ports 25, 465 and 587.
// Therefore OTP email delivery uses the Resend HTTPS API only. Do not use
// Gmail/SMTP from this service.

const RESEND_API = 'https://api.resend.com/emails'

export const isResendConfigured = () => Boolean(process.env.RESEND_API_KEY)

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
  // Always use the HTTPS API. This bypasses Render's SMTP port restriction.
  return sendWithResend({ to, subject, text, html })
}
