(() => {
  'use strict';
  const style = document.createElement('style');
  style.id = 'apna-account-premium-style';
  style.textContent = `
    #ac{background:#f6faf8!important;color:#17372b!important}
    #ac .head{height:64px!important;background:#087a49!important;color:#fff!important;border:0!important;box-shadow:0 3px 14px rgba(0,0,0,.12)!important}
    #ac .ac-btn{color:#fff!important}
    #ac .ac-title{font-size:20px!important;letter-spacing:.3px}
    #ac .ac-body{padding:18px 16px 60px!important}
    #ac .ac-sup{margin:0 0 14px!important;padding:14px 15px!important;border:1px solid #dcebe4!important;border-radius:16px!important;background:#fff!important;box-shadow:0 3px 12px rgba(18,75,48,.05)!important}
    #ac .ac-sup span{font-size:15px!important;color:#244c3d!important}
    #ac .ac-proceed{background:#087a49!important;border-radius:10px!important;font-size:14px!important;padding:9px 14px!important}
    #ac .ac-profile{padding:16px!important;margin-bottom:14px!important;border-radius:18px!important;background:#fff!important;border:1px solid #dcebe4!important;box-shadow:0 3px 12px rgba(18,75,48,.05)!important;cursor:pointer!important}
    #ac .ac-avatar{width:68px!important;height:68px!important;background:#e6f6ee!important;border:2px solid #c8e8d8!important;font-size:35px!important}
    #ac .ac-name{font-size:20px!important;color:#17372b!important}
    #ac .ac-arrow{color:#087a49!important;font-size:32px!important}
    #ac .ac-actions{gap:10px!important}
    #ac .ac-card{min-height:105px!important;border:1px solid #dcebe4!important;border-radius:16px!important;background:#fff!important;color:#214637!important;box-shadow:0 3px 12px rgba(18,75,48,.04)!important;font-size:15px!important}
    #ac .ac-earn{margin:12px 0 20px!important;border:0!important;border-radius:16px!important;background:linear-gradient(135deg,#087a49,#0a9860)!important;color:#fff!important;box-shadow:0 6px 18px rgba(8,122,73,.2)!important}
    #ac .ac-earn strong{color:#fff!important;font-size:16px!important}
    #ac .ac-earn small{color:#dcf6e9!important}
    #ac .ac-money{color:#087a49!important;background:#fff!important;border:0!important;border-radius:10px!important;font-size:21px!important}
    #ac .ac-sec{font-size:16px!important;color:#17372b!important;margin:20px 4px 6px!important}
    #ac .ac-row{min-height:54px!important;border-bottom:1px solid #e2eee8!important;background:#fff!important;padding:0 10px!important;border-radius:10px!important;margin:3px 0!important;font-size:14px!important;color:#294b3d!important}
    #ac .ac-ico{color:#087a49!important}
    #ac .ac-logout{background:#fff!important;border:1px solid #087a49!important;color:#087a49!important;border-radius:11px!important}
    #ac .ac-modal{background:rgba(7,35,23,.52)!important}
    #ac .ac-sheet{background:#fff!important;border-radius:22px 22px 0 0!important;border:1px solid #dcebe4!important}
    #ac .profile-hero{display:flex;align-items:center;gap:14px;padding:8px 0 18px;border-bottom:1px solid #e2eee8;margin-bottom:12px}
    #ac .profile-big-avatar{width:76px;height:76px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#e6f6ee;border:2px solid #bfe4d1;font-size:38px;flex:0 0 auto}
    #ac .profile-big-avatar img{width:100%;height:100%;object-fit:cover}
    #ac .profile-hero-name{font-size:20px;font-weight:800;color:#17372b}
    #ac .profile-hero-contact{font-size:13px;color:#6a7b74;margin-top:5px;word-break:break-all}
    #ac .profile-field-label{display:block;font-size:12px;font-weight:700;color:#5f7069;margin:9px 0 3px}
    #ac .profile-address-card{border:1px solid #dcebe4;border-radius:12px;padding:12px;margin:8px 0;background:#f8fcfa}
    #ac .profile-address-card strong{display:block;color:#17372b;margin-bottom:4px}
    #ac .profile-address-card small{color:#61736b;line-height:1.4}
    #ac .profile-empty{padding:16px;text-align:center;color:#6d7b76;background:#f7faf9;border-radius:12px;margin:8px 0}
  `;
  document.head.appendChild(style);

  const USER_KEY = 'apna-cart-user';
  const ADDRESS_KEY = 'apna-cart-addresses';
  const PHOTO_KEY = 'apna-cart-profile-photo';

  const getUser = () => { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') || {} } catch { return {} } };
  const saveUser = (user) => { try { localStorage.setItem(USER_KEY, JSON.stringify(user)) } catch {} };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getPhoto = () => { try { return localStorage.getItem(PHOTO_KEY) || '' } catch { return '' } };
  const getAddresses = () => { try { return JSON.parse(localStorage.getItem(ADDRESS_KEY) || '[]') || [] } catch { return [] } };
  const saveAddresses = (items) => { try { localStorage.setItem(ADDRESS_KEY, JSON.stringify(items)) } catch {} };

  function findSheet() { return document.querySelector('#ac .ac-sheet'); }
  function closeSheet() { document.querySelector('#ac .ac-modal')?.remove(); }
  function showModal(title, body, onReady) {
    closeSheet();
    const modal = document.createElement('div');
    modal.className = 'ac-modal';
    modal.innerHTML = `<section class="ac-sheet"><h3>${title}</h3>${body}<button class="ac-secondary profile-close" type="button">Close</button></section>`;
    document.body.appendChild(modal);
    modal.querySelector('.profile-close').onclick = () => modal.remove();
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    onReady?.(modal);
    return modal;
  }

  function profilePhotoHtml() {
    const photo = getPhoto();
    return photo ? `<img src="${esc(photo)}" alt="Profile photo">` : '<span>👤</span>';
  }

  function editProfile() {
    const user = getUser();
    const photo = getPhoto();
    showModal('Edit Profile', `
      <div class="profile-hero"><div class="profile-big-avatar">${photo ? `<img src="${esc(photo)}" alt="Profile">` : '<span>👤</span>'}</div><div><div class="profile-hero-name">${esc(user.name || 'Apna Cart User')}</div><div class="profile-hero-contact">${esc(user.contact || '')}</div></div></div>
      <label class="profile-field-label">Full Name</label><input id="pf-name" value="${esc(user.name || '')}" placeholder="Your full name">
      <label class="profile-field-label">Gender</label><select id="pf-gender"><option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
      <label class="profile-field-label">Preferred Language</label><select id="pf-language"><option>English</option><option>हिन्दी</option><option>मराठी</option></select>
      <button class="ac-primary" id="pf-save" type="button">Save Profile</button>
      <button class="ac-secondary" id="pf-photo" type="button">📷 Change Profile Photo</button>
    `, modal => {
      const gender = modal.querySelector('#pf-gender');
      const language = modal.querySelector('#pf-language');
      gender.value = user.gender || '';
      language.value = user.language || 'English';
      modal.querySelector('#pf-save').onclick = () => {
        const name = modal.querySelector('#pf-name').value.trim();
        if (!name) return alert('Name required hai.');
        saveUser({...user, name, gender: gender.value, language: language.value});
        modal.remove();
        editProfile();
        window.dispatchEvent(new Event('apna-cart-profile-updated'));
      };
      modal.querySelector('#pf-photo').onclick = () => {
        modal.remove();
        if (typeof window.openProfilePhotoPanel === 'function') window.openProfilePhotoPanel();
        else alert('Profile photo option load ho raha hai. Please ek baar refresh karein.');
      };
    });
  }

  function addresses() {
    const items = getAddresses();
    const list = items.length ? items.map((a, i) => `<div class="profile-address-card"><strong>${esc(a.label || 'Home')}</strong><small>${esc(a.name || '')}${a.phone ? ` · ${esc(a.phone)}` : ''}<br>${esc(a.address || '')}<br>${esc(a.city || '')}, ${esc(a.state || '')} - ${esc(a.pincode || '')}</small><button class="ac-secondary" data-del-address="${i}" type="button">Delete</button></div>`).join('') : '<div class="profile-empty">Abhi koi saved address nahi hai.</div>';
    showModal('My Addresses', `${list}<button class="ac-primary" id="add-address" type="button">＋ Add New Address</button>`, modal => {
      modal.querySelectorAll('[data-del-address]').forEach(btn => btn.onclick = () => { const next = getAddresses(); next.splice(Number(btn.dataset.delAddress), 1); saveAddresses(next); modal.remove(); addresses(); });
      modal.querySelector('#add-address').onclick = () => addAddress();
    });
  }

  function addAddress() {
    showModal('Add New Address', `
      <label class="profile-field-label">Address Type</label><select id="ad-label"><option>Home</option><option>Work</option><option>Other</option></select>
      <label class="profile-field-label">Full Name</label><input id="ad-name" placeholder="Receiver name">
      <label class="profile-field-label">Mobile Number</label><input id="ad-phone" inputmode="numeric" placeholder="10-digit mobile">
      <label class="profile-field-label">Full Address</label><input id="ad-address" placeholder="House no., street, area">
      <label class="profile-field-label">City</label><input id="ad-city" placeholder="City">
      <label class="profile-field-label">State</label><input id="ad-state" placeholder="State">
      <label class="profile-field-label">Pincode</label><input id="ad-pin" inputmode="numeric" placeholder="6-digit pincode">
      <button class="ac-primary" id="ad-save" type="button">Save Address</button>
    `, modal => {
      modal.querySelector('#ad-save').onclick = () => {
        const q = id => modal.querySelector(id).value.trim();
        const item = {label:q('#ad-label'),name:q('#ad-name'),phone:q('#ad-phone'),address:q('#ad-address'),city:q('#ad-city'),state:q('#ad-state'),pincode:q('#ad-pin')};
        if (!item.name || !item.phone || !item.address || !item.city || !item.state || !/^\d{6}$/.test(item.pincode)) return alert('Please complete name, mobile, address, city, state aur 6-digit pincode.');
        const items = getAddresses(); items.push(item); saveAddresses(items); modal.remove(); addresses();
      };
    });
  }

  function enhanceProfileClick() {
    const profile = document.querySelector('#ac .ac-profile');
    if (!profile || profile.dataset.profileEnhanced === '1') return;
    profile.dataset.profileEnhanced = '1';
    profile.title = 'Open profile';
    profile.onclick = e => { e.preventDefault(); e.stopPropagation(); editProfile(); };
  }

  function addProfileRows() {
    const body = document.querySelector('#ac .ac-body');
    if (!body || body.dataset.profileRows === '1') return;
    const section = [...body.querySelectorAll('.ac-sec')].find(el => (el.textContent || '').trim() === 'Others');
    if (!section) return;
    section.insertAdjacentHTML('beforebegin', `
      <div class="ac-sec">My Account</div>
      <div class="ac-row" data-profile-action="edit"><span class="ac-ico">✏️</span>Edit Profile</div>
      <div class="ac-row" data-profile-action="address"><span class="ac-ico">📍</span>My Addresses</div>
    `);
    body.dataset.profileRows = '1';
    body.querySelector('[data-profile-action="edit"]').onclick = editProfile;
    body.querySelector('[data-profile-action="address"]').onclick = addresses;
  }

  function refreshProfileName() {
    const root = document.querySelector('#ac');
    if (!root) return;
    const user = getUser();
    const name = root.querySelector('.ac-profile .ac-name');
    if (name) name.textContent = user.name || user.contact || 'Apna Cart User';
  }

  function watch() {
    const observer = new MutationObserver(() => {
      if (document.querySelector('#ac')) {
        enhanceProfileClick();
        addProfileRows();
      }
    });
    observer.observe(document.body, {childList:true, subtree:true});
    window.addEventListener('apna-cart-profile-updated', refreshProfileName);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
})();
