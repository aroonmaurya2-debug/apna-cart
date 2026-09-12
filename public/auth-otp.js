(function () {
  'use strict';
  var API='/api';
  var busy=false;
  function styles(){
    if(document.getElementById('auth-otp-style')) return;
    var s=document.createElement('style'); s.id='auth-otp-style';
    s.textContent='.otp-status{margin:10px 0;padding:10px 12px;border-radius:10px;background:#edf8f2;color:#176143;font:600 13px system-ui}.otp-error{background:#fff1f1;color:#a32b2b}.otp-actions{display:flex;gap:8px;margin-top:8px}.otp-actions button{flex:1}.otp-back{background:#eef3f0!important;color:#234!important}.otp-resend{background:transparent!important;color:#087a49!important;border:1px solid #b9ddca!important}';
    document.head.appendChild(s);
  }
  function msg(box,text,error){
    var old=box.querySelector('.otp-status'); if(old) old.remove();
    var p=document.createElement('div'); p.className='otp-status'+(error?' otp-error':''); p.textContent=text; box.appendChild(p); return p;
  }
  function input(box,placeholder,type){
    var el=document.createElement('input'); el.placeholder=placeholder; el.type=type||'text'; el.autocomplete='one-time-code'; el.style.cssText='width:100%;box-sizing:border-box;margin:6px 0;padding:12px;border:1px solid #cfe2d8;border-radius:10px;font-size:15px'; box.appendChild(el); return el;
  }
  async function requestOtp(box,name,contact){
    if(busy) return; busy=true;
    var button=box.querySelector('.otp-send'); if(button) button.disabled=true;
    try{
      var r=await fetch(API+'/auth/request-otp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:name,contact:contact})});
      var d=await r.json().catch(function(){return {}});
      if(!r.ok) throw new Error(d.message||'OTP send nahi ho saka.');
      renderVerify(box,name,contact,d.message||'OTP bhej diya gaya.');
    }catch(e){ msg(box,e.message||'OTP send nahi ho saka.',true); if(button) button.disabled=false; }
    busy=false;
  }
  function renderVerify(box,name,contact,notice){
    box.innerHTML='';
    var close=document.createElement('button'); close.className='close'; close.type='button'; close.textContent='×'; close.onclick=function(){var x=document.querySelector('.login-modal .close'); if(x&&x!==close)x.click()}; box.appendChild(close);
    var h=document.createElement('h2'); h.textContent='Verify OTP'; box.appendChild(h);
    var p=document.createElement('p'); p.textContent='OTP '+contact+' par bheja gaya hai.'; p.style.cssText='color:#52665d;font-size:14px'; box.appendChild(p);
    var code=input(box,'6-digit OTP','text'); code.inputMode='numeric'; code.maxLength=6;
    var status=msg(box,notice,false);
    var actions=document.createElement('div'); actions.className='otp-actions';
    var back=document.createElement('button'); back.className='otp-back'; back.type='button'; back.textContent='Back'; back.onclick=function(){renderLogin(box)};
    var verify=document.createElement('button'); verify.className='otp-send'; verify.type='button'; verify.textContent='Verify & Login';
    actions.appendChild(back); actions.appendChild(verify); box.appendChild(actions);
    var resend=document.createElement('button'); resend.className='otp-resend'; resend.type='button'; resend.textContent='Resend OTP'; resend.style.cssText+=';margin-top:8px;width:100%'; resend.onclick=function(){requestOtp(box,name,contact)}; box.appendChild(resend);
    verify.onclick=async function(){
      var value=code.value.trim(); if(!/^\d{6}$/.test(value)){msg(box,'6 digit OTP daliye.',true);return}
      if(busy)return; busy=true; verify.disabled=true;
      try{
        var r=await fetch(API+'/auth/verify-otp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contact:contact,otp:value})});
        var d=await r.json().catch(function(){return {}});
        if(!r.ok) throw new Error(d.message||'OTP verify nahi hua.');
        if(d.token) localStorage.setItem('apna-cart-token',d.token);
        if(d.user) localStorage.setItem('apna-cart-user',JSON.stringify(d.user));
        location.reload();
      }catch(e){msg(box,e.message||'OTP verify nahi hua.',true);verify.disabled=false;}
      busy=false;
    };
    code.focus();
  }
  function renderLogin(box){
    box.innerHTML='';
    var close=document.createElement('button'); close.className='close'; close.type='button'; close.textContent='×'; close.onclick=function(){var x=document.querySelector('.login-modal .close'); if(x&&x!==close)x.click()}; box.appendChild(close);
    var h=document.createElement('h2'); h.textContent='Login / Register'; box.appendChild(h);
    var name=input(box,'Name','text'); name.autocomplete='name';
    var contact=input(box,'Mobile / Email','text'); contact.autocomplete='email';
    var button=document.createElement('button'); button.className='otp-send'; button.type='button'; button.textContent='Send OTP'; box.appendChild(button);
    button.onclick=function(){var n=name.value.trim(),c=contact.value.trim();if(!n||!c){msg(box,'Name aur mobile/email bhariye.',true);return}requestOtp(box,n,c)};
  }
  function wire(){
    styles();
    var box=document.querySelector('.login-modal'); if(!box)return;
    if(box.getAttribute('data-otp-wired')==='1')return;
    box.setAttribute('data-otp-wired','1');
    renderLogin(box);
  }
  function start(){wire();var root=document.getElementById('root');if(root)new MutationObserver(function(){wire()}).observe(root,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
