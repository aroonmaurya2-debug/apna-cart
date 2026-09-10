import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ReferralEarn from './ReferralEarn.tsx'

const mount = document.createElement('div')
mount.id = 'referral-root'
document.body.appendChild(mount)
createRoot(mount).render(<StrictMode><ReferralEarn /></StrictMode>)
