(() => {
  'use strict'
  const token = () => localStorage.getItem('apna-cart-auth-token') || localStorage.getItem('apna-cart-token') || ''
  const api = (url) => fetch(url, { headers: token() ? { Authorization: `Bearer ${token()}` } : {} }).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw Error(d.message || 'Request failed'); return d })
  const money = v => `₹${Number(v || 0).toLocaleString('en-IN')}`
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]))
  const css = () => { if (document.getElementById('seller-earnings-css')) return; const s=document.createElement('style'); s.id='seller-earnings-css'; s.textContent='.sem-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:10px 0}.sem-box{padding:14px;border:1px solid #d9ebe2;border-radius:13px;background:#f7fcf9}.sem-box small{display:block;color:#6b7d75}.sem-box b{display:block;font-size:22px;color:#087a49;margin-top:5px}.sem-row{display:flex;justify-content:space-between;gap:10px;padding:12px 0;border-bottom:1px solid #e3ece7}.sem-note{padding:10px;background:#eff8f4;border-radius:10px;color:#176b50;font-size:13px;margin-bottom:10px}'; document.head.appendChild(s) }
  const open = async () => {
    css()
    try {
      const d = await api('/api/sellers/orders'); const orders=Array.isArray(d.orders)?d.orders:[]; let grossSales=0,commission=0,deliveredOrders=0,otherOrders=0; orders.forEach(o=>{const gross=(o.items||[]).reduce((sum,i)=>sum+Number(i.price||0)*Number(i.quantity||1),0); if(o.status==='Delivered'){deliveredOrders++;grossSales+=gross;commission+=gross*0.10}else otherOrders++}); const sellerEarnings=grossSales-commission;
      const m=document.createElement('div'); m.className='ac-modal'; m.innerHTML=`<section class="ac-sheet"><h3>Seller Earnings</h3><div class="sem-note">Delivered orders ke basis par earnings calculate ho rahi hain. Current commission rate 10%.</div><div class="sem-grid"><div class="sem-box"><small>Gross sales</small><b>${money(grossSales)}</b></div><div class="sem-box"><small>Your earnings</small><b>${money(sellerEarnings)}</b></div><div class="sem-box"><small>Commission</small><b>${money(commission)}</b></div><div class="sem-box"><small>Delivered orders</small><b>${esc(deliveredOrders)}</b></div></div><div class="sem-row"><span>Processing / other orders</span><b>${esc(otherOrders)}</b></div><button class="ac-secondary close">Close</button></section>`; document.body.appendChild(m); m.querySelector('.close').onclick=()=>m.remove()
    } catch (e) { const m=document.createElement('div'); m.className='ac-modal'; m.innerHTML=`<section class="ac-sheet"><h3>Seller Earnings</h3><div class="sem-note">${esc(e.message)}</div><button class="ac-secondary close">Close</button></section>`; document.body.appendChild(m); m.querySelector('.close').onclick=()=>m.remove() }
  }
  document.addEventListener('click', e => { const b=e.target?.closest?.('.seller-tile[data-s="earnings"]'); if(!b)return; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); open() }, true)
})()
