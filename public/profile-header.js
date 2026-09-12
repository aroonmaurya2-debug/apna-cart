// Top profile icon opens Login/Register when signed out, otherwise opens Account/Profile.
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
