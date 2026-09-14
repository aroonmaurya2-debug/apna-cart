import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.DEV ? 'http://localhost:10000/api' : 'https://apna-cart-2rcq.onrender.com/api'

type User = { name?: string; contact?: string }

export default function AccountPage() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const readUser = () => {
      try { setUser(JSON.parse(localStorage.getItem('apna-cart-user') || 'null')) } catch { setUser(null) }
    }
    readUser()
    const accountButton = document.querySelector('.bottom-nav button:last-child') as HTMLButtonElement | null
    if (!accountButton) return
    const onAccount = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
      readUser()
      setOpen(true)
    }
    accountButton.addEventListener('click', onAccount, true)
    return () => accountButton.removeEventListener('click', onAccount, true)
  }, [])

  if (!open) return null

  const name = user?.name || 'Apna Cart User'
  const contact = user?.contact || 'Login to continue'
  const goSeller = () => { window.location.href = '/seller' }
  const close = () => setOpen(false)

  return <div className="ac-page">
    <style>{`
      .ac-page{position:fixed;inset:0;z-index:99999;background:#fff;color:#263238;font-family:Arial,sans-serif;overflow:auto}
      .ac-head{height:64px;display:flex;align-items:center;gap:16px;padding:0 20px;border-bottom:1px solid #ddd;position:sticky;top:0;background:#fff;z-index:2}
      .ac-back{border:0;background:transparent;font-size:34px;color:#555;padding:0;line-height:1}
      .ac-title{font-size:23px;font-weight:800;flex:1}
      .ac-search,.ac-cart{font-size:27px;color:#555}
      .ac-body{max-width:720px;margin:auto;padding:20px 25px 80px}
      .ac-seller{display:flex;align-items:center;justify-content:space-between;gap:15px;margin:6px 0 25px;padding:17px 0}
      .ac-seller-text{font-size:19px;font-weight:800}
      .ac-seller-sub{font-size:13px;color:#777;font-weight:500;margin-top:5px}
      .ac-proceed{border:0;background:#078a58;color:#fff;border-radius:6px;padding:12px 17px;font-size:18px;font-weight:800;box-shadow:0 3px 8px #ccc}
      .ac-profile{display:flex;align-items:center;gap:15px;margin:8px 0 18px;cursor:pointer}
      .ac-avatar{width:82px;height:82px;border-radius:50%;background:#dff5e9;display:flex;align-items:center;justify-content:center;font-size:42px;flex:none}
      .ac-name{font-size:25px;font-weight:800;flex:1}.ac-contact{font-size:17px;color:#666;margin-top:5px}.ac-arrow{font-size:38px;color:#666}
      .ac-actions{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}.ac-action{min-height:125px;border:1px solid #d6d3df;border-radius:16px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font-size:18px}.ac-action-icon{font-size:30px}
      .ac-earn{display:flex;align-items:center;justify-content:space-between;border:1px solid #cfe4db;border-radius:14px;padding:14px 16px;margin-bottom:28px;background:#fbfffd}.ac-earn strong{font-size:19px}.ac-earn small{display:block;color:#777;margin-top:5px}.ac-money{font-size:27px;font-weight:900;color:#078a58;border:2px solid #b9e0d1;border-radius:6px;padding:8px 14px}
      .ac-section{font-size:24px;font-weight:800;margin:24px 0 8px}.ac-row{display:flex;align-items:center;gap:16px;min-height:62px;border-bottom:1px solid #bbb;font-size:18px;cursor:pointer}.ac-icon{width:30px;text-align:center;font-size:23px}.ac-new{margin-left:auto;background:#e5f8ef;color:#078a58;border-radius:18px;padding:6px 11px;font-size:13px;font-weight:700}.ac-row-arrow{margin-left:auto;color:#777;font-size:28px}
      @media(max-width:430px){.ac-body{padding-left:25px;padding-right:25px}.ac-name{font-size:23px}.ac-seller{margin-bottom:18px}.ac-proceed{font-size:17px}}
    `}</style>
    <header className="ac-head"><button className="ac-back" onClick={close}>‹</button><div className="ac-title">ACCOUNT</div><span className="ac-search">⌕</span><span className="ac-cart">🛒</span></header>
    <main className="ac-body">
      <div className="ac-seller">
        <div><div className="ac-seller-text">Go to Seller Hub</div><div className="ac-seller-sub">Manage your products, orders &amp; earnings</div></div>
        <button className="ac-proceed" onClick={goSeller}>Proceed&nbsp; ›</button>
      </div>
      <div className="ac-profile"><div className="ac-avatar">👤</div><div><div className="ac-name">{name}</div><div className="ac-contact">{contact}</div></div><span className="ac-arrow">›</span></div>
      <div className="ac-actions"><button className="ac-action"><span className="ac-action-icon">📞</span>Help Centre</button><button className="ac-action"><span className="ac-action-icon">🔤</span>Change Language</button></div>
      <div className="ac-earn"><div><strong>Invite Friends &amp; Earn</strong><small>Cash in Apna Cart Balance</small></div><span className="ac-money">₹73</span></div>
      <div className="ac-section">My Payments</div>
      <div className="ac-row"><span className="ac-icon">🏦</span>Bank &amp; UPI Details<span className="ac-row-arrow">›</span></div>
      <div className="ac-row"><span className="ac-icon">💳</span>Payment &amp; Refund<span className="ac-row-arrow">›</span></div>
      <div className="ac-section">My Activity</div>
      <div className="ac-row"><span className="ac-icon">🔤</span>Change Language<span className="ac-row-arrow">›</span></div>
      <div className="ac-row"><span className="ac-icon">❤️</span>Wishlisted Products<span className="ac-row-arrow">›</span></div>
      <div className="ac-row"><span className="ac-icon">🔗</span>Shared Products<span className="ac-row-arrow">›</span></div>
      <div className="ac-row"><span className="ac-icon">🏪</span>Followed Shops<span className="ac-new">New</span><span className="ac-row-arrow">›</span></div>
      <div className="ac-section">Others</div>
    </main>
  </div>
}
