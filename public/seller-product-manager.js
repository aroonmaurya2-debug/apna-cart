(() => {
  'use strict';
  const KEY = 'apna-cart-seller-products-v1';
  const esc = (v) => String(v ?? '').replace(/[&<>\"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const write = (items) => localStorage.setItem(KEY, JSON.stringify(items));
  const style = () => {
    if (document.getElementById('seller-products-css')) return;
    const s = document.createElement('style'); s.id = 'seller-products-css';
    s.textContent = `
      .spm-empty{padding:18px 10px;text-align:center;color:#777;border:1px dashed #cfe1d8;border-radius:12px;margin:10px 0}
      .spm-item{border:1px solid #dcebe4;border-radius:14px;padding:12px;margin:9px 0;background:#fff}
      .spm-item-top{display:flex;gap:10px;align-items:center}.spm-thumb{width:58px;height:58px;border-radius:10px;object-fit:cover;background:#e8f5ef}
      .spm-item-name{font-weight:800;flex:1}.spm-price{color:#087a49;font-weight:900}.spm-meta{font-size:12px;color:#777;margin-top:3px}
      .spm-actions{display:flex;gap:8px;margin-top:10px}.spm-actions button{flex:1;padding:9px;border-radius:8px;font-weight:700}
      .spm-edit{border:1px solid #087a49;background:#fff;color:#087a49}.spm-delete{border:1px solid #e05b5b;background:#fff;color:#c33}
      .spm-add{margin:4px 0 12px!important}.spm-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.spm-form-grid input,.spm-form-grid select{margin:0!important}.spm-full{grid-column:1/-1}
      @media(max-width:430px){.spm-form-grid{grid-template-columns:1fr}}
    `; document.head.appendChild(s);
  };
  const modal = (title, body, done) => {
    style(); const m = document.createElement('div'); m.className='ac-modal';
    m.innerHTML = `<section class="ac-sheet"><h3>${title}</h3>${body}<button class="ac-secondary spm-close">Close</button></section>`;
    document.body.appendChild(m); m.querySelector('.spm-close').onclick=()=>m.remove(); done?.(m); return m;
  };
  const form = (product={}) => `<div class="ac-msg">Seller catalog me product add/edit karein. Ye catalog phone par save rahega.</div>
    <div class="spm-form-grid">
      <input id="spn" class="spm-full" placeholder="Product name" value="${esc(product.name)}">
      <select id="spc"><option>Fashion</option><option>Beauty</option><option>Jewellery</option><option>Home</option><option>Kitchen</option><option>Footwear</option><option>Electronics</option><option>Kids</option></select>
      <select id="spg"><option>Women</option><option>Men</option><option>Kids</option><option>Unisex</option></select>
      <input id="spp" inputmode="decimal" placeholder="Selling price" value="${esc(product.price)}">
      <input id="spo" inputmode="decimal" placeholder="Original price" value="${esc(product.oldPrice)}">
      <input id="spi" class="spm-full" placeholder="Product image URL (optional)" value="${esc(product.image)}">
      <input id="spd" class="spm-full" placeholder="Short description" value="${esc(product.description)}">
    </div><button class="ac-primary spm-save">${product.id?'Update Product':'Add Product'}</button>`;
  const show = () => {
    const items = read();
    const list = items.length ? items.map(p=>`<div class="spm-item"><div class="spm-item-top"><img class="spm-thumb" src="${esc(p.image||'')}" onerror="this.style.visibility='hidden'"><div class="spm-item-name">${esc(p.name)}<div class="spm-meta">${esc(p.category)} · ${esc(p.gender)} · ${money(p.price)}</div></div></div><div class="spm-actions"><button class="spm-edit" data-edit="${esc(p.id)}">Edit</button><button class="spm-delete" data-delete="${esc(p.id)}">Delete</button></div></div>`).join('') : '<div class="spm-empty">Abhi koi seller product nahi hai.</div>';
    return modal('My Products', `<button class="ac-primary spm-add">＋ Add New Product</button><div>${list}</div>`, m=>{
      m.querySelector('.spm-add').onclick=()=>add(m);
      m.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(m,b.dataset.edit));
      m.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{if(!confirm('Product delete karein?'))return;write(read().filter(x=>String(x.id)!==String(b.dataset.delete)));m.remove();show();});
    });
  };
  const money = (v) => `₹${Number(v||0).toLocaleString('en-IN')}`;
  const fillSelects = (m,p={}) => { m.querySelector('#spc').value=p.category||'Fashion'; m.querySelector('#spg').value=p.gender||'Women'; };
  const add = (parent) => {
    parent.remove(); modal('Add Product', form(), m=>{ fillSelects(m); m.querySelector('.spm-save').onclick=()=>save(m,null); });
  };
  const edit = (parent,id) => {
    parent.remove(); const p=read().find(x=>String(x.id)===String(id)); if(!p)return show(); modal('Edit Product',form(p),m=>{fillSelects(m,p);m.querySelector('.spm-save').onclick=()=>save(m,id);});
  };
  const save = (m,id) => {
    const q=(x)=>m.querySelector(x).value.trim(); const price=Number(q('#spp')); const old=Number(q('#spo'))||price;
    if(!q('#spn')||!Number.isFinite(price)||price<=0)return alert('Product name aur valid selling price bhariye.');
    const oldItems=read(); const product={id:id||Date.now(),name:q('#spn'),category:q('#spc'),gender:q('#spg'),price,oldPrice:old,image:q('#spi'),description:q('#spd')||'Quality product from Apna Cart seller.'};
    write(id?oldItems.map(x=>String(x.id)===String(id)?product:x):[product,...oldItems]); m.remove(); show();
  };
  document.addEventListener('click',(e)=>{
    const b=e.target?.closest?.('.seller-tile[data-s="products"]');
    if(!b)return; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); show();
  },true);
})();