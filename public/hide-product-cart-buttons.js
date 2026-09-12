(function(){
  'use strict';
  function hide(){
    document.querySelectorAll('.product-info > button').forEach(function(btn){
      btn.style.setProperty('display','none','important');
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',hide); else hide();
  new MutationObserver(hide).observe(document.body,{childList:true,subtree:true});
})();
