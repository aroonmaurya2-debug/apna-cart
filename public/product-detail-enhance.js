(() => {
  const STYLE = `
  .ac-detail-extra{margin-top:18px;font-family:inherit;color:#075f3d}
  .ac-detail-label{font-weight:800;font-size:16px;margin:14px 0 9px}
  .ac-size-row{display:flex;gap:9px;flex-wrap:wrap}
  .ac-size{min-width:58px;height:42px;border:1px solid #159466;border-radius:11px;background:#fff;color:#075f3d;font-weight:800;font-size:14px}
  .ac-size.active{background:#07945d;color:#fff}
  .ac-qty{display:inline-flex;align-items:center;gap:22px;background:#e9f8f0;border-radius:24px;padding:6px 14px;margin-top:2px}
  .ac-qty button{border:0;background:transparent;color:#08794d;font-size:22px;font-weight:800;width:28px;height:32px}
  .ac-qty span{min-width:18px;text-align:center;font-weight:800}
  .ac-actions{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}
  .ac-actions button{min-height:50px;border-radius:13px;font-size:16px;font-weight:800;cursor:pointer}
  .ac-add{background:#fff;border:1.5px solid #078d58;color:#08794d}
  .ac-buy{background:#078d58;border:1.5px solid #078d58;color:#fff}
  .ac-benefits{display:grid;grid-template-columns:repeat(3,1fr);margin-top:16px;background:#eaf9f1;border-radius:14px;padding:13px 7px;gap:3px}
  .ac-benefit{text-align:center;border-right:1px solid #cbe8da;padding:2px 5px}
  .ac-benefit:last-child{border-right:0}.ac-benefit b{display:block;font-size:12px}.ac-benefit span{display:block;font-size:10px;margin-top:3px;color:#55766a}
  @media(max-width:600px){.ac-size{min-width:52px;height:40px}.ac-actions button{font-size:15px}.ac-benefits{margin-bottom:8px}}
  `;
  const addStyle=()=>{if(document.getElementById('ac-detail-enhance-style'))return;const s=document.createElement('style');s.id='ac-detail-enhance-style';s.textContent=STYLE;document.head.appendChild(s)};
  const findModal=()=>document.querySelector('.product-modal,.product-detail-overlay,[role="dialog"]');
  const findNativeAdd=(root)=>[...root.querySelectorAll('button')].find(b=>/add\s*to\s*cart/i.test(b.textContent||''));
  const enhance=()=>{
    const root=findModal(); if(!root||root.querySelector('.ac-detail-extra'))return;
    const nativeAdd=findNativeAdd(root); if(!nativeAdd)return;
    addStyle();
    const box=document.createElement('div');box.className='ac-detail-extra';
    box.innerHTML=`<div class="ac-detail-label">Size</div><div class="ac-size-row"><button class="ac-size">S</button><button class="ac-size active">M</button><button class="ac-size">L</button><button class="ac-size">XL</button><button class="ac-size">XXL</button></div><div class="ac-detail-label">Quantity</div><div class="ac-qty"><button data-q="-">−</button><span>1</span><button data-q="+">+</button></div><div class="ac-actions"><button class="ac-add">🛒 &nbsp;Add to Cart</button><button class="ac-buy">⚡ &nbsp;Buy Now</button></div><div class="ac-benefits"><div class="ac-benefit"><b>🚚 Free Delivery</b><span>On orders above ₹499</span></div><div class="ac-benefit"><b>🛡 Secure Payment</b><span>100% secure</span></div><div class="ac-benefit"><b>↩ Easy Returns</b><span>7 days return policy</span></div></div>`;
    nativeAdd.style.display='none';
    const anchor=nativeAdd.parentElement||root;anchor.appendChild(box);
    const qty=box.querySelector('.ac-qty span');let count=1;
    box.querySelectorAll('.ac-size').forEach(btn=>btn.addEventListener('click',()=>{box.querySelectorAll('.ac-size').forEach(x=>x.classList.remove('active'));btn.classList.add('active')}));
    box.querySelector('[data-q="-"]').addEventListener('click',()=>{count=Math.max(1,count-1);qty.textContent=String(count)});
    box.querySelector('[data-q="+"]').addEventListener('click',()=>{count=Math.min(10,count+1);qty.textContent=String(count)});
    const addMany=()=>{for(let i=0;i<count;i++)nativeAdd.click()};
    box.querySelector('.ac-add').addEventListener('click',addMany);
    box.querySelector('.ac-buy').addEventListener('click',()=>{addMany();setTimeout(()=>{const cart=[...document.querySelectorAll('.bottom-nav button')].find(b=>/cart/i.test(b.textContent||''));if(cart)cart.click()},120)});
  };
  const boot=()=>{addStyle();enhance();new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
