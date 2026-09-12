(function(){
'use strict';
function fix(){
  var nav=document.querySelector('.bottom-nav');
  if(!nav) return;
  var items=Array.from(nav.querySelectorAll('button'));
  var has=items.some(function(b){return /video\s*finds/i.test((b.textContent||'').trim()) || b.getAttribute('data-nav')==='video-finds';});
  if(has) return;
  var b=document.createElement('button');
  b.type='button';
  b.className='apna-bottom-item apna-video-finds-item';
  b.setAttribute('data-nav','video-finds');
  b.innerHTML='<span class="apna-bottom-icon">▶</span><span>Video Finds</span>';
  b.addEventListener('click',function(){
    var section=document.querySelector('[data-section="video-finds"],#video-finds,.video-finds');
    if(section) section.scrollIntoView({behavior:'smooth',block:'start'});
    else {var t=document.createElement('div');t.className='apna-video-finds-toast';t.textContent='Video Finds — jaldi aa raha hai 🎬';document.body.appendChild(t);setTimeout(function(){t.remove()},1800);}
  });
  nav.appendChild(b);
}
var style=document.createElement('style');
style.textContent='.bottom-nav .apna-video-finds-item{display:flex!important;flex:1!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;gap:3px!important;color:#087a49!important;background:#fff!important;border:0!important;font-weight:800!important;font-size:11px!important;padding:6px 2px!important}.bottom-nav .apna-video-finds-item .apna-bottom-icon{font-size:27px!important;line-height:1!important;color:#087a49!important}@media(max-width:430px){.bottom-nav .apna-video-finds-item{font-size:10px!important}.bottom-nav .apna-video-finds-item .apna-bottom-icon{font-size:26px!important}}';
document.head.appendChild(style);
function start(){fix();setInterval(fix,500);new MutationObserver(fix).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();