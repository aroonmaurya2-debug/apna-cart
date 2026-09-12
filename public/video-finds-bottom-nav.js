// Video Finds bottom navigation disabled. The authoritative bottom navigation is managed by /bottom-nav-update.js.
(function(){
  'use strict';
  function removeVideo(){
    var nav=document.querySelector('.bottom-nav');
    if(!nav) return;
    Array.from(nav.querySelectorAll('button')).forEach(function(b){
      if(/video\s*finds/i.test((b.textContent||'').trim())) b.remove();
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',removeVideo); else removeVideo();
})();
