(function(){
  'use strict';
  function polish(){
    var h=document.querySelector('.header .header-topline'); if(!h) return;
    var p=h.querySelector('.brand'), r=h.querySelector('.referral-header-button'), w=h.querySelector('.wishlist-header-button'), c=h.querySelector('.cart-head');
    if(p){p.classList.add('premium-profile-icon');p.setAttribute('aria-label','Profile');p.title='Profile';}
    if(r){r.classList.add('premium-referral-icon');}
    if(w){w.classList.add('premium-header-icon','premium-wishlist-icon');w.setAttribute('aria-label','Wishlist');w.title='Wishlist';}
    if(c){c.classList.add('premium-header-icon','premium-cart-icon');c.setAttribute('aria-label','Cart');c.title='Cart';}
  }
  var s=document.createElement('style');
  s.textContent=`
    .header .premium-header-icon,.header .premium-profile-icon{position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;width:38px!important;height:38px!important;min-width:38px!important;padding:0!important;border:1px solid rgba(255,255,255,.30)!important;border-radius:12px!important;background:linear-gradient(145deg,rgba(255,255,255,.21),rgba(255,255,255,.07))!important;color:#fff!important;box-shadow:0 5px 15px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.20)!important;backdrop-filter:blur(7px)!important;-webkit-backdrop-filter:blur(7px)!important;font-size:0!important;line-height:1!important;transition:transform .18s ease,box-shadow .18s ease,background .18s ease!important}
    .header .premium-header-icon::before,.header .premium-profile-icon::before{font-size:21px!important;line-height:1!important;filter:drop-shadow(0 2px 3px rgba(0,0,0,.22))!important}
    .header .premium-wishlist-icon::before{content:'♡'!important;font-family:Arial,sans-serif;font-weight:700!important}
    .header .premium-cart-icon::before{content:'🛒'!important;font-size:19px!important}
    .header .premium-profile-icon{border-radius:50%!important}
    .header .premium-profile-icon::before{content:'👤'!important;font-size:20px!important}
    .header .premium-referral-icon{height:38px!important;display:inline-flex!important;align-items:center!important;gap:6px!important;padding:0 10px!important;border:1px solid rgba(255,255,255,.30)!important;border-radius:12px!important;background:linear-gradient(145deg,rgba(255,255,255,.21),rgba(255,255,255,.07))!important;color:#fff!important;box-shadow:0 5px 15px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.20)!important;backdrop-filter:blur(7px)!important;-webkit-backdrop-filter:blur(7px)!important;font-size:12px!important;font-weight:800!important;white-space:nowrap!important}
    .header .premium-referral-icon span:first-child{font-size:18px!important;line-height:1!important;filter:drop-shadow(0 2px 3px rgba(0,0,0,.22))!important}
    .header .premium-header-icon:hover,.header .premium-profile-icon:hover,.header .premium-referral-icon:hover{transform:translateY(-2px)!important;box-shadow:0 8px 20px rgba(0,0,0,.20),inset 0 1px 0 rgba(255,255,255,.24)!important;background:linear-gradient(145deg,rgba(255,255,255,.28),rgba(255,255,255,.10))!important}
    .header .premium-header-icon:active,.header .premium-profile-icon:active,.header .premium-referral-icon:active{transform:scale(.93)!important}
    @media(max-width:430px){.header .premium-header-icon,.header .premium-profile-icon{width:34px!important;height:34px!important;min-width:34px!important;border-radius:10px!important}.header .premium-profile-icon{border-radius:50%!important}.header .premium-header-icon::before,.header .premium-profile-icon::before{font-size:19px!important}.header .premium-cart-icon::before{font-size:17px!important}.header .premium-referral-icon{height:34px!important;padding:0 7px!important;border-radius:10px!important;font-size:10px!important;gap:3px!important}.header .premium-referral-icon span:first-child{font-size:16px!important}}
  `;
  document.head.appendChild(s);
  function start(){polish();new MutationObserver(polish).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
