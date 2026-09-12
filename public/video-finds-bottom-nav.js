(function(){
  'use strict';
  function addVideoFinds(){
    var nav=document.querySelector('.bottom-nav');
    if(!nav) return;
    var buttons=Array.from(nav.querySelectorAll('button'));
    var exists=buttons.some(function(b){return (b.textContent||'').toLowerCase().indexOf('video finds')!==-1;});
    if(exists) return;
    var b=document.createElement('button');
    b.type='button';
    b.className='apna-bottom-item apna-video-finds-bottom-item';
    b.innerHTML='<span class="apna-bottom-icon">▶</span><span>Video Finds</span>';
    b.addEventListener('click',function(){
      var msg=document.createElement('div');
      msg.className='apna-video-finds-toast';
      msg.textContent='Video Finds — jaldi aa raha hai 🎬';
      document.body.appendChild(msg);
      setTimeout(function(){if(msg.parentNode)msg.remove()},1800);
    });
    nav.appendChild(b);
  }
  function start(){
    addVideoFinds();
    new MutationObserver(function(){requestAnimationFrame(addVideoFinds)}).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  var s=document.createElement('style');
  s.textContent='.bottom-nav .apna-video-finds-bottom-item{flex:1!important;color:#087a49!important;background:#fff!important;border:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;font-weight:800!important;font-size:12px!important;padding:5px 2px!important}.bottom-nav .apna-video-finds-bottom-item .apna-bottom-icon{font-size:28px!important;line-height:1!important;color:#087a49!important}@media(max-width:430px){.bottom-nav .apna-video-finds-bottom-item{font-size:11px!important;min-height:58px!important}.bottom-nav .apna-video-finds-bottom-item .apna-bottom-icon{font-size:28px!important}}';
  document.head.appendChild(s);
})();