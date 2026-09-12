(function(){
  'use strict';

  function placeFilterRow(){
    var strip=document.querySelector('.category-strip');
    var filter=document.querySelector('.filter-row');
    if(!strip || !filter) return;

    /* Always move the actual React filter row into the category section,
       immediately after the category tiles. Do not depend on both elements
       originally sharing the same parent because the React layout can change. */
    if(strip.nextElementSibling !== filter){
      strip.parentNode.insertBefore(filter, strip.nextElementSibling);
    }

    strip.style.removeProperty('margin-bottom');
    filter.style.removeProperty('position');
    filter.style.removeProperty('top');
    filter.style.removeProperty('left');
    filter.style.removeProperty('width');
    filter.style.removeProperty('z-index');
    filter.classList.add('filter-row-under-category');

    var menu=document.querySelector('.category-menu');
    if(menu){
      menu.style.removeProperty('position');
      menu.style.removeProperty('top');
      menu.style.removeProperty('left');
      menu.style.removeProperty('right');
      menu.style.removeProperty('width');
    }
  }

  function start(){
    placeFilterRow();
    window.addEventListener('resize',placeFilterRow,{passive:true});
    new MutationObserver(function(){requestAnimationFrame(placeFilterRow)}).observe(document.body,{childList:true,subtree:true});
  }

  var style=document.createElement('style');
  style.textContent=''
    +'.filter-row-under-category{width:100%!important;box-sizing:border-box!important;margin:8px 0 12px!important;padding:0 2px!important;position:relative!important;top:auto!important;left:auto!important;z-index:10!important;}'
    +'.category-strip{margin-bottom:0!important;}'
    +'@media(max-width:430px){.filter-row-under-category{margin:7px 0 10px!important;padding:0!important;}}';
  document.head.appendChild(style);

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
