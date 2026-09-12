// Top profile icon opens the Login/Register flow when signed out, otherwise opens Account/Profile.
(function(){
  'use strict';
  function openAccount(){
    if(typeof window.openAccountLogin==='function'){
      window.openAccountLogin();
      return true;
    }
    var buttons=Array.from(document.querySelectorAll('.bottom-nav button'));
    var account=buttons.find(function(b){
      var t=(b.textContent||'').trim().toLowerCase();
      return t==='account' || t==='profile' || t.indexOf('account')!==-1 || t.indexOf('profile')!==-1;
    });
    if(account){ account.click(); return true; }
    var nav=document.querySelector('.bottom-nav');
    if(nav){
      var temp=document.createElement('button');
      temp.type='button';
      temp.textContent='Account';
      temp.setAttribute('aria-hidden','true');
      temp.style.cssText='position:absolute!important;left:-99999px!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important;';
      nav.appendChild(temp);
      temp.click();
      setTimeout(function(){ if(temp.parentNode) temp.parentNode.removeChild(temp); },0);
      return true;
    }
    return false;
  }
  document.addEventListener('click', function(e){
    var target=e.target;
    var brand=target && target.closest ? target.closest('.header .brand') : null;
    if(!brand) return;
    e.preventDefault();
    e.stopPropagation();
    openAccount();
  }, true);
})();
