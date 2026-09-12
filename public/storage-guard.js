// Apna Cart startup guard: keep malformed localStorage from crashing React on boot.
(() => {
  const safeJson = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key)
      if (raw == null || raw === '') return
      JSON.parse(raw)
    } catch (_) {
      try { localStorage.removeItem(key) } catch (_) {}
    }
  }
  safeJson('apna-cart-user', null)
  safeJson('apna-cart-cart', [])
})()
