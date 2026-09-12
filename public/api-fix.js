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

  // One-time cleanup of every old Apna Cart service worker/cache.
  // Reload only after unregistering so an old cached bundle cannot keep the app blank.
  if ('serviceWorker' in navigator && !sessionStorage.getItem('apna-cart-sw-cleared')) {
    sessionStorage.setItem('apna-cart-sw-cleared', '1');
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(() => ('caches' in window) ? caches.keys() : [])
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('apna-cart-')).map((key) => caches.delete(key))))
      .then(() => window.location.reload())
      .catch(() => undefined);
  }
})();
