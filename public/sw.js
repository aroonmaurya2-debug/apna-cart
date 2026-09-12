// Apna Cart no longer uses a service worker. This file intentionally unregisters
// any old worker and clears its caches so old app shells cannot break startup.
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    } catch (_) {}
    try {
      await self.registration.unregister()
    } catch (_) {}
    try {
      const clients = await self.clients.matchAll()
      clients.forEach((client) => client.navigate(client.url))
    } catch (_) {}
  })())
})

self.addEventListener('fetch', () => {})
