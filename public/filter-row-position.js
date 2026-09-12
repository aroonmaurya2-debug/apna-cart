(function(){
  'use strict';

  function positionFilters(){
    var strip=document.querySelector('.category-strip');
    var filter=document.querySelector('.filter-row');
    if(!strip || !filter){
      if(filter){
        filter.style.removeProperty('position');
        filter.style.removeProperty('top');
        filter.style.removeProperty('left');
        filter.style.removeProperty('width');
        filter.style.removeProperty('z-index');
      }
      return;
    }

    var r=strip.getBoundingClientRect();
    var top=r.bottom + window.scrollY + 8;
    filter.style.setProperty('position','absolute','important');
    filter.style.setProperty('top',top+'px','important');
    filter.style.setProperty('left',r.left+'px','important');
    filter.style.setProperty('width',r.width+'px','important');
    filter.style.setProperty('z-index','1100','important');
    filter.style.setProperty('box-sizing','border-box','important');

    strip.style.setProperty('margin-bottom','56px','important');

    var menu=document.querySelector('.category-menu');
    if(menu){
      var fr=filter.getBoundingClientRect();
      menu.style.setProperty('position','absolute','important');
      menu.style.setProperty('top',(fr.bottom + window.scrollY + 6)+'px','important');
      menu.style.setProperty('left',r.left+'px','important');
      menu.style.setProperty('right','auto','important');
      menu.style.setProperty('width',r.width+'px','important');
      menu.style.setProperty('box-sizing','border-box','important');
      menu.style.setProperty('z-index','1200','important');
    }
  }

  function start(){
    positionFilters();
    window.addEventListener('resize',positionFilters,{passive:true});
    window.addEventListener('scroll',positionFilters,{passive:true});
    new MutationObserver(function(){requestAnimationFrame(positionFilters)}).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
