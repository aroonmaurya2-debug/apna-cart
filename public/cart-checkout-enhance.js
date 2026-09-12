(() => {
  const STYLE = `
  .ac-cart-polished,.ac-checkout-polished{color:#183d30}
  .ac-cart-polished [data-ac-card],.ac-checkout-polished [data-ac-card]{background:#fff;border:1px solid #dcefe6;border-radius:18px;box-shadow:0 6px 20px rgba(24,61,48,.07)}
  .ac-cart-polished input,.ac-checkout-polished input,.ac-checkout-polished textarea,.ac-checkout-polished select{border:1px solid #cfe5da!important;border-radius:12px!important;min-height:44px;padding:10px 12px;outline:none}
  .ac-cart-polished input:focus,.ac-checkout-polished input:focus,.ac-checkout-polished textarea:focus,.ac-checkout-polished select:focus{border-color:#159466!important;box-shadow:0 0 0 3px rgba(21,148,102,.10)}
  .ac-cart-polished button,.ac-checkout-polished button{border-radius:12px}
  .ac-cart-polished .ac-primary,.ac-checkout-polished .ac-primary{background:#078d58!important;color:#fff!important;border-color:#078d58!important;box-shadow:0 7px 16px rgba(7,141,88,.18)}
  .ac-cart-polished [data-ac-qty]{display:inline-flex;align-items:center;justify-content:center;gap:12px;background:#eaf8f1;border-radius:12px;padding:4px 7px}
  .ac-cart-polished [data-ac-qty] button{min-width:32px!important;width:32px!important;height:32px!important;border:0!important;background:#fff!important;color:#08794d!important;font-size:19px!important;font-weight:900!important;border-radius:9px!important}
  .ac-cart-polished [data-ac-summary],.ac-checkout-polished [data-ac-summary]{position:sticky;bottom:72px;background:#f3fbf7;border:1px solid #d5eee2;border-radius:16px;padding:14px;margin-top:14px;z-index:3}
  .ac-checkout-polished [data-ac-payment]{border:1px solid #d4e9df!important;background:#fff!important;border-radius:14px!important;padding:12px!important;margin:7px 0!important}
  .ac-checkout-polished [data-ac-payment]:hover,.ac-checkout-polished [data-ac-payment].active{border-color:#078d58!important;background:#effaf5!important}
  .ac-checkout-polished [data-ac-title]{font-weight:900;color:#075f3d}
  @media(max-width:600px){.ac-cart-polished,.ac-checkout-polished{padding-bottom:88px}.ac-cart-polished [data-ac-summary],.ac-checkout-polished [data-ac-summary]{bottom:64px}.ac-cart-polished [data-ac-card],.ac-checkout-polished [data-ac-card]{border-radius:15px}}
  `;
  const style=()=>{if(document.getElementById('ac-cart-checkout-style'))return;const s=document.createElement('style');s.id='ac-cart-checkout-style';s.textContent=STYLE;document.head.appendChild(s)};
  const text=(el)=>((el?.textContent)||'').replace(/\s+/g,' ').trim();
  const visible=(el)=>!!el&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden';
  const nearest=(el,limit=6)=>{let n=el;for(let i=0;i<limit&&n;i++,n=n.parentElement){if(n.children.length>=2)return n}return el?.parentElement||el};
  const polish=()=>{
    style();
    const all=[...document.querySelectorAll('body *')].filter(visible);
    const cartHead=all.find(e=>/^(cart|shopping cart|your cart)$/i.test(text(e))&&text(e).length<40);
    const checkoutHead=all.find(e=>/^(checkout|place order|delivery address)$/i.test(text(e))&&text(e).length<50);
    const root=cartHead?nearest(cartHead):checkoutHead?nearest(checkoutHead):null;
    if(!root)return;
    const isCart=!!cartHead;
    root.classList.add(isCart?'ac-cart-polished':'ac-checkout-polished');
    root.querySelectorAll(':scope > div, :scope > section').forEach((el)=>{if(el.children.length>=2)el.setAttribute('data-ac-card','1')});
    const primaryWords=isCart?/checkout|place order|proceed|buy now/i:/place order|pay|continue/i;
    root.querySelectorAll('button').forEach((b)=>{
      const t=text(b); if(primaryWords.test(t)){b.classList.add('ac-primary');b.setAttribute('data-ac-primary','1')}
      if(/\+|add/i.test(t)||/−|-|remove/i.test(t)){
        const p=nearest(b,3); if(p&&!p.hasAttribute('data-ac-qty')&&p.querySelectorAll('button').length>=2)p.setAttribute('data-ac-qty','1')
      }
      if(/upi|card|net banking|wallet|cash on delivery/i.test(t))b.setAttribute('data-ac-payment','1');
    });
    const summary=[...root.querySelectorAll('div,section')].find(e=>/total|grand total|order summary/i.test(text(e))&&text(e).length<250);
    if(summary)summary.setAttribute('data-ac-summary','1');
    root.querySelectorAll('h1,h2,h3,h4,strong,b').forEach(e=>{if(text(e).length<70)e.setAttribute('data-ac-title','1')});
  };
  let timer;const boot=()=>{polish();new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(polish,80)}).observe(document.body,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
