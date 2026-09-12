(function(){
  'use strict';
  function polish(){
    var h=document.querySelector('.header .header-topline'); if(!h) return;
    var w=h.querySelector('.wishlist-header-button'), c=h.querySelector('.cart-head');
    if(w){w.classList.add('premium-header-icon','premium-wishlist-icon'); w.setAttribute('aria-label','Wishlist'); w.title='Wishlist';}
    if(c){c.classList.add('premium-header-icon','premium-cart-icon'); c.setAttribute('aria-label','Cart'); c.title='Cart';}
  }
  var s=document.createElement('style');
  s.textContent=`
    .header .premium-header-icon{position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;width:40px!important;height:40px!important;min-width:40px!important;padding:0!important;border:1px solid rgba(255,255,255,.28)!important;border-radius:13px!important;background:linear-gradient(145deg,rgba(255,255,255,.20),rgba(255,255,255,.07))!important;color:#fff!important;box-shadow:0 5px 16px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.18)!important;backdrop-filter:blur(7px)!important;-webkit-backdrop-filter:blur(7px)!important;font-size:0!important;line-height:1!important;transition:transform .18s ease,box-shadow .18s ease,background .18s ease!important}
    .header .premium-header-icon::before{font-size:22px!important;line-height:1!important;filter:drop-shadow(0 2px 3px rgba(0,0,0,.22))!important}
    .header .premium-wishlist-icon::before{content:'♡'!important;font-family:Arial,sans-serif;font-weight:700!important}
    .header .premium-cart-icon::before{content:'🛒'!important;font-size:20px!important}
    .header .premium-header-icon:hover{transform:translateY(-2px)!important;box-shadow:0 8px 20px rgba(0,0,0,.20),inset 0 1px 0 rgba(255,255,255,.22)!important;background:linear-gradient(145deg,rgba(255,255,255,.27),rgba(255,255,255,.10))!important}
    .header .premium-header-icon:active{transform:scale(.92)!important}
    @media(max-width:430px){.header .premium-header-icon{width:36px!important;height:36px!important;min-width:36px!important;border-radius:11px!important}.header .premium-header-icon::before{font-size:20px!important}.header .premium-cart-icon::before{font-size:18px!important}}
  `;
  document.head.appendChild(s);
  function start(){polish();new MutationObserver(polish).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
