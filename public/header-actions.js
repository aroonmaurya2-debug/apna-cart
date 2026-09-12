(function(){
  'use strict';
  function setup(){
    var header=document.querySelector('.header .header-topline');
    if(!header) return;

    if(!header.querySelector('.referral-header-button')){
      var brand=header.querySelector('.brand');
      var b=document.createElement('button');
      b.className='referral-header-button'; b.type='button';
      b.setAttribute('aria-label','Refer and Earn'); b.title='Refer & Earn';
      b.innerHTML='<span>🎁</span><span>Refer & Earn</span>';
      b.onclick=function(){openReferral()};
      if(brand && brand.nextSibling) header.insertBefore(b,brand.nextSibling); else header.appendChild(b);
    }

    var brand=header.querySelector('.brand');
    var referral=header.querySelector('.referral-header-button');
    var wish=header.querySelector('.wishlist-header-button');
    var cart=header.querySelector('.cart-head');
    var search=header.querySelector('.search-box');

    // Requested header arrangement:
    // left: Profile -> Refer & Earn
    // right: Save/Wishlist -> Cart
    // search stays on its own row below.
    if(brand) brand.style.setProperty('order','1','important');
    if(referral){
      referral.style.setProperty('order','2','important');
      referral.style.setProperty('margin-left','0','important');
    }
    if(wish){
      wish.style.setProperty('order','3','important');
      wish.style.setProperty('margin-left','auto','important');
      wish.style.setProperty('margin-right','6px','important');
    }
    if(cart){
      cart.style.setProperty('order','4','important');
      cart.style.setProperty('margin-left','0','important');
    }
    if(search){
      search.style.setProperty('order','5','important');
      search.style.setProperty('flex','0 0 100%','important');
      search.style.setProperty('width','100%','important');
    }
  }

  function openReferral(){
    var old=document.getElementById('referral-panel'); if(old){old.classList.add('open');return}
    var user={}; try{user=JSON.parse(localStorage.getItem('apna-cart-user')||'{}')}catch(e){}
    var contact=String(user.contact||'').replace(/\D/g,'').slice(-6)||'APNA';
    var code='APNA'+contact;
    var p=document.createElement('div'); p.id='referral-panel'; p.className='referral-panel open';
    p.innerHTML='<div class="referral-sheet"><button class="referral-close" type="button">×</button><div class="referral-icon">🎁</div><h2>Refer & Earn</h2><p>Apne friends ko Apna Cart par invite karein aur rewards earn karein.</p><div class="referral-code"><span>Your Referral Code</span><b>'+code+'</b></div><button class="referral-share" type="button">📤 Share Referral</button><p class="referral-note">Referral rewards ke rules aur amount campaign ke hisaab se change ho sakte hain.</p></div>';
    document.body.appendChild(p);
    p.querySelector('.referral-close').onclick=function(){p.remove()};
    p.onclick=function(e){if(e.target===p)p.remove()};
    p.querySelector('.referral-share').onclick=function(){
      var text='Apna Cart par shopping karo! Mera referral code '+code+' use karo.';
      if(navigator.share) navigator.share({title:'Apna Cart - Refer & Earn',text:text}).catch(function(){});
      else if(navigator.clipboard) navigator.clipboard.writeText(text).then(function(){alert('Referral message copy ho gaya.')});
      else alert(text);
    };
  }

  var s=document.createElement('style');
  s.textContent='.referral-header-button{height:40px;border:0;background:transparent;color:#fff;display:flex;align-items:center;gap:6px;font-weight:800;font-size:13px;padding:0 8px;cursor:pointer;white-space:nowrap}.referral-header-button span:first-child{font-size:21px}.referral-header-button:active{transform:scale(.96)}.referral-panel{position:fixed;inset:0;z-index:10000;background:rgba(8,35,24,.42);display:flex;align-items:flex-end;justify-content:center}.referral-sheet{position:relative;width:min(100%,520px);box-sizing:border-box;background:#fff;border-radius:24px 24px 0 0;padding:28px 20px 30px;text-align:center;font-family:system-ui,sans-serif;box-shadow:0 -8px 30px rgba(0,0,0,.2)}.referral-close{position:absolute;right:14px;top:12px;width:34px;height:34px;border:0;border-radius:50%;background:#edf8f2;color:#087a49;font-size:22px}.referral-icon{font-size:44px}.referral-sheet h2{margin:8px 0 6px;color:#183d30}.referral-sheet p{margin:0 auto 18px;color:#66746f;font-size:14px;max-width:420px}.referral-code{background:#eaf8f1;border:1px dashed #0b8a59;border-radius:14px;padding:12px;margin:14px 0}.referral-code span{display:block;color:#668077;font-size:12px}.referral-code b{display:block;color:#087a49;font-size:22px;letter-spacing:1px;margin-top:4px}.referral-share{width:100%;min-height:46px;border:0;border-radius:12px;background:#078a58;color:#fff;font-size:15px;font-weight:800}.referral-note{font-size:11px!important;margin-top:12px!important;margin-bottom:0!important}@media(max-width:430px){.referral-header-button{font-size:11px;padding:0 4px;gap:3px}.referral-header-button span:first-child{font-size:18px}}';
  document.head.appendChild(s);

  function start(){setup();new MutationObserver(function(){setup()}).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
