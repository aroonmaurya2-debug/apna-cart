import { useEffect, useMemo, useState } from 'react'
import './ReferralEarn.css'

const API = import.meta.env.DEV ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'
const APP_LINK = 'https://aroonmaurya2-debug.github.io/apna-cart/'

export default function ReferralEarn() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [invites, setInvites] = useState(0)
  const [message, setMessage] = useState('')
  const token = () => localStorage.getItem('apna-cart-token')
  const inviteLink = useMemo(() => `${APP_LINK}?ref=${encodeURIComponent(code)}`, [code])

  async function loadReferral() {
    const t = token()
    if (!t) return setMessage('Refer & Earn use karne ke liye pehle login karein.')
    try {
      const response = await fetch(`${API}/referrals/me`, { headers: { authorization: `Bearer ${t}` } })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Referral data load nahi hua.')
      setCode(data.referral?.code || '')
      setInvites(Number(data.referral?.successfulInvites || 0))
      setMessage('')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Referral data load nahi hua.') }
  }

  useEffect(() => {
    const referButton = document.querySelector('.refer-pill') as HTMLButtonElement | null
    if (!referButton) return
    const openReferral = (event: Event) => { event.preventDefault(); event.stopPropagation(); setOpen(true) }
    referButton.addEventListener('click', openReferral)
    return () => referButton.removeEventListener('click', openReferral)
  }, [])
  useEffect(() => { if (open) void loadReferral() }, [open])

  async function inviteWhatsApp() {
    if (!code) return setMessage('Pehle login karke referral link generate karein.')
    const t = token()
    try {
      if (t) await fetch(`${API}/referrals/invite`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${t}` }, body: JSON.stringify({ code }) })
    } catch { /* sharing can continue */ }

    const text = `🛍️ Apna Cart join karo! Fashion, Home, Beauty aur Electronics ek hi app me. Mere referral link se app open karo: ${inviteLink}`
    const encoded = encodeURIComponent(text)

    // Android/iOS WhatsApp app chooser: opens WhatsApp's contact/chat selection with the message prefilled.
    const appUrl = `whatsapp://send?text=${encoded}`
    const webUrl = `https://api.whatsapp.com/send?text=${encoded}`
    let opened = false
    const onVisibility = () => { opened = true }
    document.addEventListener('visibilitychange', onVisibility, { once: true })
    window.location.href = appUrl
    window.setTimeout(() => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (!opened) window.location.href = webUrl
    }, 1200)
  }

  async function shareReferral() {
    if (!code) return setMessage('Pehle login karke referral link generate karein.')
    const text = `Apna Cart par shopping karo. Mere invite link se join karo: ${inviteLink}`
    if (navigator.share) { try { await navigator.share({ title: 'Apna Cart - Invite & Earn', text, url: inviteLink }); return } catch { return } }
    try { await navigator.clipboard.writeText(inviteLink); setMessage('Referral link copy ho gaya.') } catch { setMessage(inviteLink) }
  }

  return <>
    <button className="referral-fab" onClick={() => setOpen(true)} aria-label="Refer and Earn">🎁 <span>Refer & Earn</span></button>
    {open && <div className="referral-overlay" onClick={() => setOpen(false)}>
      <section className="referral-page" onClick={e => e.stopPropagation()}>
        <header className="referral-header"><button onClick={() => setOpen(false)} aria-label="Back">‹</button><b>INVITE & EARN</b><button onClick={() => setMessage('Invite friends and earn rewards after eligible invite activity.')} aria-label="Help">?</button></header>
        <div className="referral-hero"><div className="referral-kicker">Invite New Friends</div><h1>Earn Cash</h1><div className="referral-flow"><div>📱<span>Share Product/<br/>Invite Link</span></div><i>→</i><div>👨‍💼<span>Friends 1st<br/>Order Delivered</span></div><i>→</i><div>💰<span>Earn Cash in<br/>Apna Cart Balance</span></div></div></div>
        <div className="referral-rewards">{[1, 2, 3, 4].map(n => <div className="reward" key={n}><strong>₹73</strong><span>🔒</span><small>{n}{n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'} Invite</small></div>)}</div>
        <div className="referral-friends"><div className="friends-icon">👥</div><h2>Who can you invite?</h2><p>Friends ko Apna Cart par invite karein aur eligible invite activity complete hone par rewards unlock karein.</p><div className="referral-code">Your referral code: <b>{code || 'LOGIN REQUIRED'}</b></div><div className="referral-count">Successful invites: <b>{invites}</b></div></div>
        {message && <div className="referral-message">{message}</div>}
        <div className="referral-bottom"><button className="whatsapp-btn" onClick={inviteWhatsApp}>🟢 Invite Via WhatsApp</button><button className="share-btn" onClick={shareReferral} aria-label="Share referral link">⌯</button></div>
      </section>
    </div>}
  </>
}
