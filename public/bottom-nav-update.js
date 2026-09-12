(function(){
  'use strict';
  function openMall(){
    var old=document.querySelector('.apna-mall-overlay');
    if(old) old.remove();
    var overlay=document.createElement('div');
    overlay.className='apna-mall-overlay';
    overlay.innerHTML='<section class="apna-mall-sheet" role="dialog" aria-modal="true" aria-label="Apna Cart Mall">'
      +'<div class="apna-mall-head"><div><span class="apna-mall-kicker">APNA CART MALL</span><h2>Shop from Mall</h2><p>Premium stores aur trusted categories ek jagah.</p></div><button type="button" class="apna-mall-close" aria-label="Close">×</button></div>'
      +'<div class="apna-mall-grid">'
      +'<button type="button" data-mall-cat="8PM Offer"><b>⚡</b><span>Deals</span><small>Up to 50% OFF</small></button>'
      +'<button type="button" data-mall-cat="Saree"><b>👗</b><span>Fashion</span><small>New arrivals</small></button>'
      +'<button type="button" data-mall-cat="Jewellery"><b>💎</b><span>Jewellery</span><small>Trending styles</small></button>'
      +'<button type="button" data-mall-cat="Beauty"><b>💄</b><span>Beauty</span><small>Everyday essentials</small></button>'
      +'<button type="button" data-mall-cat="Kitchen"><b>🍳</b><span>Home & Kitchen</span><small>Smart picks</small></button>'
      +'<button type="button" data-mall-cat="Electronics"><b>📱</b><span>Electronics</span><small>Top gadgets</small></button>'
      +'</div><div class="apna-mall-note">🚚 Easy shopping · 💳 Secure checkout · 📦 Order tracking</div></section>';
    document.body.appendChild(overlay);
    function close(){overlay.remove()}
    overlay.addEventListener('click',function(e){
      if(e.target===overlay || e.target.closest('.apna-mall-close')){close();return}
      var b=e.target.closest('[data-mall-cat]');
      if(!b)return;
      var cat=b.getAttribute('data-mall-cat');
      var strip=document.querySelector('.category-strip');
      if(strip){var target=Array.from(strip.querySelectorAll('button')).find(function(x){return (x.textContent||'').toLowerCase().indexOf(cat.toLowerCase())!==-1});if(target){close();target.click();strip.scrollIntoView({behavior:'smooth',block:'start'});}}
    });
  }
  function ensureNav(){
    var nav=document.querySelector('.bottom-nav');
    if(!nav) return;
    var old=Array.from(nav.querySelectorAll('button'));
    if(old.length<2) return;
    var home=old.find(function(b){return /home/i.test(b.textContent||'')})||old[0];
    var orders=old.find(function(b){return /orders?/i.test(b.textContent||'')})||old[1];
    var labels=Array.from(nav.querySelectorAll('button')).map(function(b){return (b.textContent||'').trim()});
    var wanted=['Home','Orders','Category','Mall'];
    if(labels.length===4 && wanted.every(function(x,i){return labels[i]===x})){
      var mall=old[3]; if(mall && !mall.dataset.mallBound){mall.dataset.mallBound='1';mall.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openMall()})}
      return;
    }
    nav.innerHTML='';
    function item(icon,label,fn){
      var b=document.createElement('button');
      b.type='button'; b.className='apna-bottom-item';
      b.innerHTML='<span class="apna-bottom-icon">'+icon+'</span><span>'+label+'</span>';
      b.addEventListener('click',fn); nav.appendChild(b); return b;
    }
    item('⌂','Home',function(){home.click()});
    item('▦','Orders',function(){orders.click()});
    item('▤','Category',function(){var x=document.querySelector('.category-strip');if(x)x.scrollIntoView({behavior:'smooth',block:'start'})});
    item('🏬','Mall',openMall);
  }
  var style=document.createElement('style');
  style.textContent='.bottom-nav{background:#fff!important;border-top:1px solid #dbe9e1!important;box-shadow:0 -5px 18px rgba(18,75,48,.08)!important}.bottom-nav .apna-bottom-item{flex:1!important;border:0!important;background:#fff!important;color:#087a49!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;font-family:inherit!important;font-weight:800!important;font-size:11px!important;padding:6px 2px!important}.apna-bottom-icon{font-size:27px!important;line-height:1!important;color:#087a49!important}.apna-mall-overlay{position:fixed;inset:0;background:rgba(9,25,18,.48);z-index:100000;display:flex;align-items:flex-end;justify-content:center;padding:0}.apna-mall-sheet{width:100%;max-width:620px;background:#fff;border-radius:24px 24px 0 0;padding:20px 16px 24px;box-sizing:border-box;box-shadow:0 -12px 40px rgba(0,0,0,.18)}.apna-mall-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.apna-mall-kicker{font-size:11px;font-weight:900;letter-spacing:1.5px;color:#0a8a55}.apna-mall-head h2{margin:4px 0;font-size:24px;color:#17211d}.apna-mall-head p{margin:0;color:#66756e;font-size:13px}.apna-mall-close{width:40px;height:40px;border:0;border-radius:50%;background:#f0f6f3;color:#163c2d;font-size:25px}.apna-mall-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.apna-mall-grid button{border:1px solid #e0ebe6;background:linear-gradient(145deg,#f8fcfa,#eef8f3);border-radius:16px;padding:14px;text-align:left;display:grid;grid-template-columns:42px 1fr;column-gap:9px;align-items:center;cursor:pointer}.apna-mall-grid b{grid-row:span 2;font-size:28px;text-align:center}.apna-mall-grid span{font-size:14px;font-weight:900;color:#183d30}.apna-mall-grid small{font-size:11px;color:#718078;margin-top:2px}.apna-mall-note{margin-top:14px;background:#f5faf7;border-radius:12px;padding:11px;text-align:center;font-size:12px;color:#567068}@media(max-width:430px){.bottom-nav .apna-bottom-item{font-size:10px!important}.apna-bottom-icon{font-size:26px!important}.apna-mall-sheet{padding-bottom:22px}.apna-mall-head h2{font-size:21px}}';
  document.head.appendChild(style);
  function start(){ensureNav();new MutationObserver(function(){requestAnimationFrame(ensureNav)}).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
