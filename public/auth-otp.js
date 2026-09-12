(function () {
  'use strict';
  var API='/api';
  var busy=false;
  function styles(){
    if(document.getElementById('auth-otp-style')) return;
    var s=document.createElement('style'); s.id='auth-otp-style';
    s.textContent=''+
      '.modal-backdrop{position:fixed!important;inset:0!important;z-index:99999!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:16px!important;background:rgba(0,0,0,.58)!important;box-sizing:border-box!important;overflow:auto!important}'+
      '.modal-backdrop .login-modal{position:relative!important;display:block!important;width:min(440px,100%)!important;max-width:440px!important;max-height:calc(100vh - 32px)!important;overflow:auto!important;margin:auto!important;padding:24px 18px!important;background:#fff!important;color:#17352a!important;border:1px solid #d7ebe1!important;border-radius:22px!important;box-shadow:0 18px 60px rgba(0,0,0,.30)!important;box-sizing:border-box!important;opacity:1!important;transform:none!important}'+
      '.modal-backdrop .login-modal h2{margin:0 42px 8px 0!important;color:#075f3d!important;font-size:24px!important;line-height:1.2!important}'+
      '.modal-backdrop .login-modal input{display:block!important;width:100%!important;height:48px!important;box-sizing:border-box!important;margin:8px 0!important;padding:12px 13px!important;border:1px solid #cfe2d8!important;border-radius:12px!important;background:#fff!important;color:#17352a!important;font-size:15px!important;outline:none!important}'+
      '.modal-backdrop .login-modal input:focus{border-color:#07834e!important;box-shadow:0 0 0 3px rgba(7,131,78,.10)!important}'+
      '.modal-backdrop .login-modal button{border-radius:12px!important;padding:12px 14px!important;font-weight:800!important}'+
      '.modal-backdrop .login-modal button:not(.close):not(.otp-back):not(.otp-resend){background:#07834e!important;color:#fff!important;border:0!important;width:100%!important;margin-top:8px!important}'+
      '.modal-backdrop .login-modal .close{position:absolute!important;right:12px!important;top:12px!important;width:38px!important;height:38px!important;border:0!important;border-radius:50%!important;background:#eef3f0!important;color:#234!important;font-size:25px!important;line-height:1!important;padding:0!important}'+
      '.modal-backdrop .login-modal .otp-actions{display:flex!important;gap:8px!important;margin-top:8px!important}'+
      '.modal-backdrop .login-modal .otp-actions button{width:auto!important;flex:1!important;margin-top:0!important}'+
      '.otp-status{margin:10px 0;padding:10px 12px;border-radius:10px;background:#edf8f2;color:#176143;font:600 13px system-ui}.otp-error{background:#fff1f1;color:#a32b2b}.otp-actions{display:flex;gap:8px;margin-top:8px}.otp-actions button{flex:1}.otp-back{background:#eef3f0!important;color:#234!important;border:0!important}.otp-resend{background:transparent!important;color:#087a49!important;border:1px solid #b9ddca!important}.account-login-overlay{position:fixed!important;inset:0!important;z-index:100000!important;background:rgba(0,0,0,.58)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;box-sizing:border-box!important;overflow:auto!important}.account-login-card{position:relative!important;width:min(460px,100%)!important;max-height:calc(100vh - 40px)!important;overflow:auto!important;box-sizing:border-box!important;background:#fff!important;color:#17352a!important;border:1px solid #d7ebe1!important;border-radius:22px!important;padding:24px 18px!important;box-shadow:0 18px 60px rgba(0,0,0,.28)!important;font-family:system-ui,sans-serif!important;opacity:1!important}.account-login-card h2{margin:0 42px 6px 0!important;color:#075f3d!important;font-size:24px!important;line-height:1.2!important}.account-login-card .login-sub{margin:0 0 14px!important;color:#60736a!important;font-size:14px!important;line-height:1.45!important}.account-login-card input{display:block!important;width:100%!important;height:48px!important;box-sizing:border-box!important;margin:8px 0!important;padding:12px 13px!important;border:1px solid #cfe2d8!important;border-radius:12px!important;background:#fff!important;color:#17352a!important;font-size:15px!important;outline:none!important}.account-login-card input:focus{border-color:#07834e!important;box-shadow:0 0 0 3px rgba(7,131,78,.1)!important}.account-login-card button{border:0;border-radius:12px;padding:13px;font-weight:800;cursor:pointer}.account-login-card .otp-send{width:100%;margin-top:8px;background:#07834e;color:#fff}.account-login-close{position:absolute!important;right:12px!important;top:12px!important;width:38px!important;height:38px!important;border-radius:50%!important;background:#eef3f0!important;color:#234!important;font-size:25px!important;line-height:1!important;padding:0!important}.account-login-head{position:relative!important}.account-login-card .otp-actions{display:flex}.account-login-card .otp-actions button{width:auto;margin-top:0}.account-login-card .otp-back{background:#eef3f0!important}.account-login-card .otp-resend{background:transparent!important;color:#087a49!important;border:1px solid #b9ddca!important;width:100%;margin-top:8px}';
    document.head.appendChild(s);
  }
  function msg(box,text,error){var old=box.querySelector('.otp-status');if(old)old.remove();var p=document.createElement('div');p.className='otp-status'+(error?' otp-error':'');p.textContent=text;box.appendChild(p);return p;}
  function input(box,placeholder,type){var el=document.createElement('input');el.placeholder=placeholder;el.type=type||'text';el.autocomplete='one-time-code';box.appendChild(el);return el;}
  function requestOtp(box,name,contact){
    if(busy)return;
    busy=true;
    var button=box.querySelector('.otp-send');
    if(button)button.disabled=true;
    fetch(API+'/auth/request-otp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:name,contact:contact})})
      .then(function(r){return r.json().catch(function(){return {}}).then(function(d){if(!r.ok)throw new Error(d.message||'OTP send nahi ho saka.');renderVerify(box,name,contact,d.message||'OTP bhej diya gaya.');});})
      .catch(function(e){msg(box,e.message||'OTP send nahi ho saka.',true);if(button)button.disabled=false;})
      .finally(function(){busy=false;});
  }
  function clearAndTitle(box,title,sub){box.innerHTML='';var head=document.createElement('div');head.className='account-login-head';var close=document.createElement('button');close.className='account-login-close';close.type='button';close.textContent='×';close.onclick=function(){closeModal()};head.appendChild(close);var h=document.createElement('h2');h.textContent=title;head.appendChild(h);box.appendChild(head);if(sub){var p=document.createElement('p');p.className='login-sub';p.textContent=sub;box.appendChild(p);}}
  function renderVerify(box,name,contact){
    clearAndTitle(box,'Verify OTP','OTP '+contact+' par bheja gaya hai.');
    var code=input(box,'6-digit OTP','text');code.inputMode='numeric';code.maxLength=6;code.autocomplete='one-time-code';msg(box,'OTP bhej diya gaya.',false);
    var actions=document.createElement('div');actions.className='otp-actions';var back=document.createElement('button');back.className='otp-back';back.type='button';back.textContent='Back';back.onclick=function(){renderLogin(box)};var verify=document.createElement('button');verify.className='otp-send';verify.type='button';verify.textContent='Verify & Login';actions.appendChild(back);actions.appendChild(verify);box.appendChild(actions);
    var resend=document.createElement('button');resend.className='otp-resend';resend.type='button';resend.textContent='Resend OTP';resend.onclick=function(){requestOtp(box,name,contact)};box.appendChild(resend);
    verify.onclick=function(){
      var value=code.value.trim();
      if(!/^\d{6}$/.test(value)){msg(box,'6 digit OTP daliye.',true);return}
      if(busy)return;
      busy=true;verify.disabled=true;
      fetch(API+'/auth/verify-otp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contact:contact,otp:value})})
        .then(function(r){return r.json().catch(function(){return {}}).then(function(d){
          if(!r.ok)throw new Error(d.message||'OTP verify nahi hua.');
          if(!d.token)throw new Error('Login token nahi mila. Dobara OTP verify karein.');
          localStorage.setItem('apna-cart-token',d.token);
          localStorage.setItem('apna-cart-auth-token',d.token);
          if(d.user)localStorage.setItem('apna-cart-user',JSON.stringify(d.user));
          localStorage.removeItem('apna-cart-login-in-progress');
          localStorage.removeItem('apna-cart-open-account');
          location.reload();
        });})
        .catch(function(e){msg(box,e.message||'OTP verify nahi hua.',true);verify.disabled=false;})
        .finally(function(){busy=false;});
    };
    code.focus();
  }
  function renderLogin(box){
    clearAndTitle(box,'Login / Register','Mobile ya email se OTP ke through login karein.');
    var name=input(box,'Name','text');name.autocomplete='name';var contact=input(box,'Mobile / Email','text');contact.autocomplete='email';
    var button=document.createElement('button');button.className='otp-send';button.type='button';button.textContent='Send OTP';box.appendChild(button);
    button.onclick=function(){var n=name.value.trim(),c=contact.value.trim();if(!n||!c){msg(box,'Name aur mobile/email bhariye.',true);return}requestOtp(box,n,c)};
  }
  function closeModal(){var x=document.querySelector('.account-login-overlay');if(x)x.remove();var old=document.querySelector('.login-modal');if(old&&old.parentNode)old.parentNode.removeChild(old);document.body.style.overflow='';localStorage.removeItem('apna-cart-login-in-progress');localStorage.removeItem('apna-cart-open-account');}
  function openAccountLogin(){styles();if(document.querySelector('.account-login-overlay'))return;document.body.style.overflow='hidden';var overlay=document.createElement('div');overlay.className='account-login-overlay';overlay.onclick=function(e){if(e.target===overlay)closeModal()};var card=document.createElement('div');card.className='account-login-card';overlay.appendChild(card);document.body.appendChild(overlay);renderLogin(card);}
  function wireExisting(){var box=document.querySelector('.login-modal');if(!box)return;if(box.getAttribute('data-otp-wired')==='1')return;box.setAttribute('data-otp-wired','1');renderLogin(box);}
  function accountClick(e){var btn=e.target.closest&&e.target.closest('.bottom-nav button');if(!btn)return;var text=(btn.textContent||'').toLowerCase();if(text.indexOf('account')===-1&&text.indexOf('profile')===-1)return;if(localStorage.getItem('apna-cart-user'))return;e.preventDefault();e.stopImmediatePropagation();openAccountLogin();}
  function start(){styles();wireExisting();document.addEventListener('click',accountClick,true);var root=document.getElementById('root');if(root)new MutationObserver(function(){wireExisting()}).observe(root,{childList:true,subtree:true});}
  window.openAccountLogin=openAccountLogin;
  window.closeAccountLogin=closeModal;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();