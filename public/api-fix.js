(() => {
  const LIVE_API_HOST = 'https://apna-cart-2rcq.onrender.com';
  const OLD_API_HOST = 'https://cart-2rcq.onrender.com';
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === 'string') input = input.replace(OLD_API_HOST, LIVE_API_HOST);
    else if (input instanceof Request) input = new Request(input.url.replace(OLD_API_HOST, LIVE_API_HOST), input);
    else if (input instanceof URL) input = new URL(input.toString().replace(OLD_API_HOST, LIVE_API_HOST));
    return originalFetch(input, init);
  };

  // Clear old service workers/caches on every fresh app version so an installed
  // PWA cannot keep serving an old blank-page bundle.
  const cleanupKey = 'apna-cart-sw-cleared-v2';
  if ('serviceWorker' in navigator && !sessionStorage.getItem(cleanupKey)) {
    sessionStorage.setItem(cleanupKey, '1');
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(() => ('caches' in window) ? caches.keys() : [])
      .then((keys) => Promise.all(keys.map((key) => key.startsWith('apna-cart-') ? caches.delete(key) : false)))
      .then(() => window.location.reload())
      .catch(() => undefined);
  }
})();
