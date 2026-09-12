// Top profile icon should open the real Account/Profile button, not Video Finds.
(function(){
  'use strict';
  document.addEventListener('click', function(e){
    const target=e.target;
    const brand=target && target.closest ? target.closest('.header .brand') : null;
    if(!brand) return;
    e.preventDefault();
    e.stopPropagation();
    const buttons=Array.from(document.querySelectorAll('.bottom-nav button'));
    const account=buttons.find(function(b){
      const t=(b.textContent||'').trim().toLowerCase();
      return t==='account' || t==='profile' || t.indexOf('account')!==-1 || t.indexOf('profile')!==-1;
    });
    if(account) account.click();
  }, true);
})();
