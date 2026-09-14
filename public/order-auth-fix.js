(() => {
  const originalFetch = window.fetch.bind(window)
  window.fetch = (input, init = {}) => {
    try {
      const url = typeof input === 'string' ? input : input?.url || ''
      if (/\/api\/orders(?:\?|\/|$)/.test(url)) {
        const token = localStorage.getItem('apna-cart-token') || localStorage.getItem('apna-cart-auth-token')
        if (token) {
          const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined) || {})
          if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
          init = { ...init, headers }
        }
      }
    } catch (_) {}
    return originalFetch(input, init)
  }
})()
