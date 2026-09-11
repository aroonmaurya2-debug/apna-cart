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

  // Clear old Apna Cart service-worker control/cache so stale GitHub Pages
  // bundles cannot keep the app on a blank screen after a deployment.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => undefined);
  }
  if ('caches' in window) {
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('apna-cart-')).map((key) => caches.delete(key))))
      .catch(() => undefined);
  }
})();
