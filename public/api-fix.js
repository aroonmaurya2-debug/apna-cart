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
})();
