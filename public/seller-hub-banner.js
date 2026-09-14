(() => {
  'use strict';
  const GREEN = '#078a58';
  const install = () => {
    const account = document.querySelector('#ac-account');
    if (!account || account.querySelector('.ac-seller-hub-banner')) return;
    const body = account.querySelector('.body');
    if (!body) return;

    const style = document.createElement('style');
    style.textContent = `
      #ac-account .ac-seller-hub-banner{display:flex;align-items:center;justify-content:space-between;gap:14px;background:#fff;border:1px solid #bfe5d4;border-radius:14px;padding:15px 14px;margin:0 0 16px;box-shadow:0 2px 8px rgba(16,80,53,.08)}
      #ac-account .ac-seller-hub-copy{min-width:0;flex:1}.ac-seller-hub-title{font-size:18px;font-weight:800;color:#18372c}.ac-seller-hub-sub{font-size:12px;color:#6c7b75;margin-top:5px}
      #ac-account .ac-seller-hub-button{border:0;background:${GREEN};color:#fff;border-radius:7px;padding:10px 14px;font-size:16px;font-weight:800;white-space:nowrap;box-shadow:0 3px 7px rgba(7,138,88,.22)}
      #ac-account .ac-seller-hub-icon{width:42px;height:42px;border-radius:12px;background:#e5f7ee;display:grid;place-items:center;font-size:24px;flex:none}
      @media(max-width:380px){#ac-account .ac-seller-hub-banner{gap:9px;padding:13px 11px}.ac-seller-hub-title{font-size:16px}.ac-seller-hub-sub{font-size:11px}.ac-seller-hub-button{font-size:14px!important;padding:9px 11px!important}}
    `;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.className = 'ac-seller-hub-banner';
    banner.innerHTML = `<span class="ac-seller-hub-icon">🏪</span><div class="ac-seller-hub-copy"><div class="ac-seller-hub-title">Go to Seller Hub</div><div class="ac-seller-hub-sub">Manage your products, orders &amp; earnings</div></div><button class="ac-seller-hub-button" type="button">Proceed&nbsp; ›</button>`;
    banner.querySelector('button').onclick = () => { window.location.href = '/seller'; };
    body.prepend(banner);
  };

  const observer = new MutationObserver(install);
  observer.observe(document.body, { childList: true, subtree: true });
  install();
})();
