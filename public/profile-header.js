// Make the new top profile icon open the same Account flow as the bottom Account tab.
(function(){
  document.addEventListener('click', function(e){
    const target = e.target;
    const brand = target && target.closest ? target.closest('.header .brand') : null;
    if (!brand) return;
    e.preventDefault();
    e.stopPropagation();
    const account = document.querySelector('.bottom-nav button:last-child');
    if (account) account.click();
  }, true);
})();
