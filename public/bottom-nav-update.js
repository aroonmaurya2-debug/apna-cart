(function(){
  'use strict';
  function ensureNav(){
    var nav=document.querySelector('.bottom-nav');
    if(!nav) return;
    var old=Array.from(nav.querySelectorAll('button'));
    if(old.length<2) return;
    var home=old.find(function(b){return /home/i.test(b.textContent||'')})||old[0];
    var orders=old.find(function(b){return /orders?/i.test(b.textContent||'')})||old[1];
    var labels=Array.from(nav.querySelectorAll('button')).map(function(b){return (b.textContent||'').trim()});
    var wanted=['Home','Orders','Category','Mall'];
    if(labels.length===4 && wanted.every(function(x,i){return labels[i]===x})) return;
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
    item('🏬','Mall',function(){var x=document.querySelector('.category-strip');if(x)x.scrollIntoView({behavior:'smooth',block:'start'});else home.click()});
  }
  var style=document.createElement('style');
  style.textContent='.bottom-nav{background:#fff!important;border-top:1px solid #dbe9e1!important;box-shadow:0 -5px 18px rgba(18,75,48,.08)!important}.bottom-nav .apna-bottom-item{flex:1!important;border:0!important;background:#fff!important;color:#087a49!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;font-family:inherit!important;font-weight:800!important;font-size:11px!important;padding:6px 2px!important}.apna-bottom-icon{font-size:27px!important;line-height:1!important;color:#087a49!important}@media(max-width:430px){.bottom-nav .apna-bottom-item{font-size:10px!important}.apna-bottom-icon{font-size:26px!important}}';
  document.head.appendChild(style);
  function start(){ensureNav();new MutationObserver(function(){requestAnimationFrame(ensureNav)}).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
