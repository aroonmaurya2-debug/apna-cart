# Resend Email OTP

Apna Cart can send login OTP emails through Resend using the server-side helper in `server/resend-email.mjs`.

Resend's official Node.js integration uses a server-side API key and the email send API. citeturn0search0turn0search1

## Render environment variables

Add these variables to the Render web service:

```text
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
RESEND_FROM=Apna Cart <your-verified-email@your-domain.com>
```

Never put `RESEND_API_KEY` in frontend JavaScript or GitHub source code.

## Wiring into the OTP route

The existing `/api/auth/request-otp` route can call:

```js
import { sendResendEmail } from './resend-email.mjs'

const delivered = await sendResendEmail({
  to: cleanContact,
  subject: 'Your Apna Cart OTP',
  text: `Your Apna Cart verification code is ${otp}. It expires in 5 minutes.`,
})
```

Then use the existing OTP value stored in `otpStore` for verification.

## Sender address

For production, use a sender address from a domain configured/verified in Resend. Resend's examples use `onboarding@resend.dev` for getting started. citeturn0search0
