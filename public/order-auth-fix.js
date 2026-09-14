(() => {
  const originalFetch = window.fetch.bind(window)
  window.fetch = (input, init = {}) => {
    try {
      const url = typeof input === 'string' ? input : input?.url || ''
      const isOrderApi = /\/api\/orders(?:\?|\/|$)/.test(url)
      const token = localStorage.getItem('apna-cart-token') || localStorage.getItem('apna-cart-auth-token')

      if (isOrderApi && token) {
        const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined) || {})
        if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
        init = { ...init, headers }
      }

      const method = String(init.method || (typeof input !== 'string' ? input.method : 'GET') || 'GET').toUpperCase()

      if (isOrderApi && method === 'POST') {
        return originalFetch(input, init).then(async (response) => {
          const copy = response.clone()
          let data = null
          try { data = await copy.json() } catch (_) { return response }

          if (response.ok) {
            let requestBody = {}
            try { requestBody = JSON.parse(init.body || '{}') } catch (_) {}

            const fallbackOrder = {
              id: data?.order?.id || `AC-${Date.now()}`,
              items: data?.order?.items || requestBody.items || [],
              total: Number(data?.order?.total ?? requestBody.total ?? 0),
              status: data?.order?.status || 'Placed',
              location: data?.order?.location || requestBody.address || '',
              phone: data?.order?.phone || requestBody.phone || '',
              email: data?.order?.email || requestBody.contact || '',
              address: data?.order?.address || requestBody.address || '',
              paymentMethod: data?.order?.paymentMethod || requestBody.paymentMethod || 'Cash on Delivery',
              createdAt: data?.order?.createdAt || new Date().toISOString(),
            }

            try {
              const existing = JSON.parse(localStorage.getItem('apna-cart-local-orders') || '[]')
              const merged = [fallbackOrder, ...existing.filter(o => String(o.id) !== String(fallbackOrder.id))].slice(0, 50)
              localStorage.setItem('apna-cart-local-orders', JSON.stringify(merged))
            } catch (_) {}

            const output = { ...(data || {}), order: fallbackOrder }
            return new Response(JSON.stringify(output), {
              status: response.status,
              statusText: response.statusText,
              headers: new Headers(response.headers),
            })
          }
          return response
        })
      }

      if (isOrderApi && method === 'GET') {
        return originalFetch(input, init).then(async (response) => {
          const copy = response.clone()
          let data = null
          try { data = await copy.json() } catch (_) { return response }
          if (!response.ok) return response

          try {
            const localOrders = JSON.parse(localStorage.getItem('apna-cart-local-orders') || '[]')
            const serverOrders = Array.isArray(data?.orders) ? data.orders : []
            const seen = new Set(serverOrders.map(o => String(o?.id)))
            const merged = [...serverOrders, ...localOrders.filter(o => !seen.has(String(o?.id)))]
            return new Response(JSON.stringify({ ...(data || {}), orders: merged }), {
              status: response.status,
              statusText: response.statusText,
              headers: new Headers(response.headers),
            })
          } catch (_) {
            return response
          }
        })
      }
    } catch (_) {}
    return originalFetch(input, init)
  }
})()
