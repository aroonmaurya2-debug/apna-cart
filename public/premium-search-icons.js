(function(){
  'use strict';
  function polish(){
    var box=document.querySelector('.header .search-box');
    if(!box) return;
    var buttons=box.querySelectorAll(':scope > button');
    if(!buttons.length) return;
    if(buttons[0]) buttons[0].classList.add('premium-search-mic');
    if(buttons[1]) buttons[1].classList.add('premium-search-camera');
  }
  var s=document.createElement('style');
  s.textContent=`
    .header .search-box>button.premium-search-mic,
    .header .search-box>button.premium-search-camera{
      position:relative!important;display:grid!important;place-items:center!important;
      width:34px!important;height:34px!important;min-width:34px!important;
      border:1px solid rgba(8,121,77,.18)!important;border-radius:11px!important;
      background:linear-gradient(145deg,#ffffff,#e7f7ef)!important;
      color:#08794d!important;font-size:0!important;line-height:1!important;
      box-shadow:0 4px 12px rgba(8,121,77,.16),inset 0 1px 0 rgba(255,255,255,.9)!important;
      transition:transform .18s ease,box-shadow .18s ease,background .18s ease!important;
    }
    .header .search-box>button.premium-search-mic::before,
    .header .search-box>button.premium-search-camera::before{
      content:''!important;display:block!important;width:19px!important;height:19px!important;
      background:#08794d!important;
      -webkit-mask-repeat:no-repeat!important;mask-repeat:no-repeat!important;
      -webkit-mask-position:center!important;mask-position:center!important;
      -webkit-mask-size:contain!important;mask-size:contain!important;
      filter:drop-shadow(0 1px 2px rgba(0,0,0,.12))!important;
    }
    .header .search-box>button.premium-search-mic::before{
      -webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='9' y='3' width='6' height='11' rx='3'/%3E%3Cpath d='M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8'/%3E%3C/svg%3E")!important;
      mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='9' y='3' width='6' height='11' rx='3'/%3E%3Cpath d='M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8'/%3E%3C/svg%3E")!important;
    }
    .header .search-box>button.premium-search-camera::before{
      -webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 7h3l2-2h6l2 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z'/%3E%3Ccircle cx='12' cy='13' r='3.5'/%3E%3C/svg%3E")!important;
      mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 7h3l2-2h6l2 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z'/%3E%3Ccircle cx='12' cy='13' r='3.5'/%3E%3C/svg%3E")!important;
    }
    .header .search-box>button.premium-search-mic:hover,
    .header .search-box>button.premium-search-camera:hover{
      background:linear-gradient(145deg,#ffffff,#ddf3e9)!important;
      box-shadow:0 7px 16px rgba(8,121,77,.22),inset 0 1px 0 rgba(255,255,255,.95)!important;
      transform:translateY(-1px)!important;
    }
    .header .search-box>button.premium-search-mic:active,
    .header .search-box>button.premium-search-camera:active{transform:scale(.92)!important}
    @media(max-width:600px){
      .header .search-box>button.premium-search-mic,
      .header .search-box>button.premium-search-camera{width:31px!important;height:31px!important;min-width:31px!important;border-radius:10px!important}
      .header .search-box>button.premium-search-mic::before,
      .header .search-box>button.premium-search-camera::before{width:18px!important;height:18px!important}
    }
    @media(max-width:380px){
      .header .search-box>button.premium-search-mic,
      .header .search-box>button.premium-search-camera{width:29px!important;height:29px!important;min-width:29px!important;border-radius:9px!important}
      .header .search-box>button.premium-search-mic::before,
      .header .search-box>button.premium-search-camera::before{width:17px!important;height:17px!important}
    }
  `;
  document.head.appendChild(s);
  function start(){polish();new MutationObserver(function(){requestAnimationFrame(polish)}).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
