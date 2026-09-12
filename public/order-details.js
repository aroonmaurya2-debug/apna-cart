(() => {
  const style = document.createElement('style');
  style.textContent = `
    .ac-order-tools{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.ac-order-btn{border:1px solid #bfe1d0;background:#f3fbf6;color:#08794d;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer}.ac-order-btn.primary{background:#07834e;color:#fff;border-color:#07834e}.ac-order-overlay{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.48);display:flex;align-items:flex-start;justify-content:center;padding:12px;overflow:auto}.ac-order-modal{width:min(560px,100%);background:#fff;border-radius:20px;padding:18px;box-shadow:0 18px 55px rgba(0,0,0,.25);position:relative;margin:0 auto 20px}.ac-order-close{position:absolute;right:10px;top:10px;border:0;border-radius:50%;width:36px;height:36px;background:#f1f6f3;font-size:23px;cursor:pointer}.ac-order-modal h2{margin:0 42px 6px;color:#123}.ac-order-sub{color:#5b6d64;font-size:14px;margin-bottom:18px}.ac-track{display:grid;gap:0;margin:18px 0 22px}.ac-step{display:grid;grid-template-columns:34px 1fr;gap:10px;min-height:62px;position:relative}.ac-step:not(:last-child):before{content:'';position:absolute;left:16px;top:31px;width:2px;height:48px;background:#dbeae2}.ac-dot{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#e7f3ec;color:#08794d;font-weight:900;z-index:1}.ac-step.done .ac-dot,.ac-step.active .ac-dot{background:#07834e;color:#fff}.ac-step strong{display:block;margin-top:5px;color:#17372b}.ac-step small{color:#718078}.ac-info{background:#f7fbf9;border:1px solid #e0eee7;border-radius:14px;padding:13px;margin-top:12px}.ac-actions{display:flex;gap:8px;margin-top:16px}.ac-actions button{flex:1}.ac-note{font-size:13px;color:#6c7a74;margin-top:10px}.ac-cancelled{color:#b42318;font-weight:800}.ac-return{color:#08794d;font-weight:800}
    @media(max-width:600px){.ac-order-modal{padding:15px;border-radius:18px}.ac-order-tools{gap:6px}.ac-order-btn{padding:8px 10px;font-size:13px}}
  `;
  document.head.appendChild(style);

  const esc = s => String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const statusIndex = status => { const s=String(status||'').toLowerCase(); if(s.includes('deliver')) return 3; if(s.includes('out')) return 2; if(s.includes('ship')) return 1; if(s.includes('cancel')) return -1; return 0; };
  const openDetails = card => {
    const text = card.innerText || '';
    const id = (text.match(/Order\s*#?\s*([\w-]+)/i)||[])[1] || '—';
    const total = (text.match(/(₹[\d,]+)/)||[])[1] || '—';
    const status = (text.split('\n').find(x=>/placed|shipped|out for delivery|delivered|cancel/i.test(x))||'Order Placed').trim();
    const address = text.split('\n').find(x=>x && x!==`Order #${id}` && !/₹|placed|shipped|out for delivery|delivered|cancel/i.test(x)) || 'Delivery address saved with this order';
    const idx = statusIndex(status);
    const steps=['Order Placed','Shipped','Out for Delivery','Delivered'];
    const tracking = idx < 0 ? `<div class="ac-info ac-cancelled">This order has been cancelled.</div>` : `<div class="ac-track">${steps.map((s,i)=>`<div class="ac-step ${i<=idx?'done':''} ${i===idx?'active':''}"><span class="ac-dot">${i<idx?'✓':i+1}</span><div><strong>${s}</strong><small>${i===idx?'Current status':'Status update'}</small></div></div>`).join('')}</div>`;
    const overlay=document.createElement('div'); overlay.className='ac-order-overlay'; overlay.innerHTML=`<section class="ac-order-modal"><button class="ac-order-close" aria-label="Close">×</button><h2>Order #${esc(id)}</h2><div class="ac-order-sub">Complete order details & live-style tracking</div>${tracking}<div class="ac-info"><b>Order Total</b><div style="font-size:22px;font-weight:900;color:#08794d;margin-top:4px">${esc(total)}</div></div><div class="ac-info"><b>Delivery Address</b><div style="margin-top:5px;color:#52645b">${esc(address)}</div></div><div class="ac-actions"><button class="ac-order-btn primary ac-cancel">Cancel Order</button><button class="ac-order-btn ac-return-btn">Return / Refund</button></div><div class="ac-note">Return/refund request will be recorded in this order view.</div></section>`;
    document.body.appendChild(overlay); document.body.style.overflow='hidden';
    const close=()=>{overlay.remove();document.body.style.overflow=''}; overlay.querySelector('.ac-order-close').onclick=close; overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    overlay.querySelector('.ac-cancel').onclick=()=>{ if(confirm('Cancel this order?')) { card.dataset.acStatus='Cancelled'; const p=card.querySelector('p'); if(p) p.textContent=p.textContent.replace(/^[^·]+/,'Cancelled'); close(); } };
    overlay.querySelector('.ac-return-btn').onclick=()=>{ const n=overlay.querySelector('.ac-note'); n.innerHTML='<span class="ac-return">Return / Refund request started ✓</span>'; };
  };
  const enhance=()=>document.querySelectorAll('.order-card').forEach(card=>{ if(card.dataset.acEnhanced)return; card.dataset.acEnhanced='1'; const tools=document.createElement('div'); tools.className='ac-order-tools'; tools.innerHTML='<button class="ac-order-btn primary">View Details & Track →</button>'; tools.querySelector('button').onclick=e=>{e.stopPropagation();openDetails(card)}; card.appendChild(tools); });
  enhance(); new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});
})();
