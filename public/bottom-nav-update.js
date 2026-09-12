(function(){
  'use strict';
  function updateNav(){
    var nav=document.querySelector('.bottom-nav');
    if(!nav || nav.dataset.apnaNavUpdated==='1') return;
    var old=Array.from(nav.querySelectorAll('button'));
    if(old.length<4) return;

    var home=old[0], orders=old[1];
    nav.dataset.apnaNavUpdated='1';
    nav.innerHTML='';

    function make(icon,label,handler){
      var b=document.createElement('button');
      b.type='button';
      b.className='apna-bottom-item';
      b.innerHTML='<span class="apna-bottom-icon">'+icon+'</span><span>'+label+'</span>';
      b.addEventListener('click',handler);
      nav.appendChild(b);
      return b;
    }

    make('⌂','Home',function(){home.click()});
    make('▦','Orders',function(){orders.click()});
    make('🏬','Mall',function(){
      var cat=document.querySelector('.category-strip');
      if(cat) cat.scrollIntoView({behavior:'smooth',block:'start'});
      else home.click();
    });
    make('▶','Video Finds',function(){
      var msg=document.createElement('div');
      msg.className='apna-video-finds-toast';
      msg.textContent='Video Finds — jaldi aa raha hai 🎬';
      document.body.appendChild(msg);
      setTimeout(function(){msg.remove()},1800);
    });
  }

  var style=document.createElement('style');
  style.textContent=''
    +'.bottom-nav{background:#087f4f!important;border-top:1px solid rgba(255,255,255,.18)!important;box-shadow:0 -6px 22px rgba(4,70,43,.18)!important;}'
    +'.bottom-nav .apna-bottom-item{flex:1!important;border:0!important;background:transparent!important;color:#fff!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;font-family:inherit!important;font-weight:800!important;font-size:11px!important;padding:7px 2px!important;}'
    +'.bottom-nav .apna-bottom-item:active{transform:scale(.94)!important;}'
    +'.apna-bottom-icon{font-size:21px!important;line-height:1!important;display:block!important;}'
    +'.apna-video-finds-toast{position:fixed!important;left:50%!important;bottom:82px!important;transform:translateX(-50%)!important;background:#183d30!important;color:#fff!important;padding:10px 16px!important;border-radius:999px!important;font-size:12px!important;font-weight:800!important;z-index:99999!important;box-shadow:0 8px 24px rgba(0,0,0,.25)!important;white-space:nowrap!important;}'
    +'@media(max-width:430px){.bottom-nav .apna-bottom-item{font-size:10px!important}.apna-bottom-icon{font-size:20px!important}}';
  document.head.appendChild(style);

  function start(){
    updateNav();
    new MutationObserver(function(){requestAnimationFrame(updateNav)}).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
