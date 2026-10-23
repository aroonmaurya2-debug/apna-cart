(() => {
  const APP_NAME = 'Apna Cart';
  const isReferralLanding = new URLSearchParams(location.search).has('ref');
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone()) return;

  let installPrompt = null;
  const banner = document.createElement('aside');
  banner.id = 'apna-install-banner';
  banner.setAttribute('aria-label', 'Install Apna Cart');
  banner.innerHTML = `
    <style>
      #apna-install-banner{position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:99990;display:flex;align-items:center;gap:11px;padding:12px;background:#fff;border:1px solid #cfe5dc;border-radius:18px;box-shadow:0 10px 32px #123d2d2b;color:#183d30;font-family:system-ui,-apple-system,sans-serif}
      #apna-install-banner .ac-app-icon{width:43px;height:43px;flex:0 0 43px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(145deg,#247cba,#187653);font-size:25px}
      #apna-install-banner .ac-copy{min-width:0;flex:1}#apna-install-banner .ac-copy strong{display:block;font-size:14px;line-height:1.3}#apna-install-banner .ac-copy span{display:block;color:#5a7167;font-size:11px;margin-top:3px}
      #apna-install-banner .ac-install{border:0;border-radius:11px;background:#08794d;color:#fff;padding:11px 13px;font-weight:800;font-size:12px;white-space:nowrap}
      #apna-install-banner .ac-close{border:0;background:transparent;color:#587268;font-size:21px;padding:2px;align-self:flex-start}
      #apna-install-banner .ac-help{margin:8px 0 0;padding:10px;border-radius:10px;background:#eff8f3;font-size:12px;line-height:1.5;display:none}
      #apna-install-banner .ac-help.show{display:block}
      @media(min-width:700px){#apna-install-banner{left:auto;right:22px;bottom:22px;width:410px}}
    </style>
    <div class="ac-app-icon" aria-hidden="true">🛍️</div>
    <div class="ac-copy"><strong>Apna Cart App</strong><span>Install karein aur shopping aasaan banayein</span></div>
    <button class="ac-install" type="button">Install App</button>
    <button class="ac-close" type="button" aria-label="Close">×</button>
    <div class="ac-help" role="status"></div>`;
  document.addEventListener('DOMContentLoaded', () => {
    if (isStandalone() || (!isReferralLanding && sessionStorage.getItem('apna-install-dismissed') === '1')) return;
    document.body.appendChild(banner);
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
  });
  window.addEventListener('appinstalled', () => banner.remove());

  const showHelp = text => {
    const help = banner.querySelector('.ac-help');
    help.textContent = text;
    help.classList.add('show');
  };
  banner.querySelector('.ac-install').addEventListener('click', async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') {
        showHelp('Apna Cart install ho raha hai.');
      } else {
        showHelp('Install cancel hua. Jab chahein phir se Install App dabayein.');
      }
      installPrompt = null;
      return;
    }
    showHelp('Android par Chrome mein is page ko kholen, upar ⋮ menu dabayein aur “Install app” ya “Add to Home screen” chunein. Option na mile to Chrome mein page refresh karein.');
  });
  banner.querySelector('.ac-close').addEventListener('click', () => {
    if (!isReferralLanding) sessionStorage.setItem('apna-install-dismissed', '1');
    banner.remove();
  });
})();