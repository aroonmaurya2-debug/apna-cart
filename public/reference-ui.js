(function(){
  'use strict';
  function hideStandaloneLogin(){
    document.querySelectorAll('button,a,[role="button"]').forEach(function(el){
      var text=(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(!text || !/login\s*\/\s*register|login|register/.test(text)) return;
      var insideModal=!!el.closest('[role="dialog"],.modal,.login-modal,.auth-modal,.dialog,.overlay');
      if(!insideModal && text.length<40){
        el.style.display='none';
        var parent=el.parentElement;
        if(parent && parent.children.length<=2 && /login|register/.test((parent.textContent||'').toLowerCase())) parent.style.display='none';
      }
    });
  }
  function keepReferenceLayout(){
    var root=document.getElementById('root');
    if(!root)return;
    hideStandaloneLogin();
    var nav=document.querySelector('.bottom-nav');
    if(nav){
      nav.querySelectorAll('button').forEach(function(b){
        var t=(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
        if(/account|profile|login|register/.test(t)){
          b.style.display='flex';
          b.setAttribute('aria-label','Account / Profile');
        }
      });
    }
  }
  function start(){keepReferenceLayout();var root=document.getElementById('root');if(root)new MutationObserver(function(){keepReferenceLayout()}).observe(root,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
