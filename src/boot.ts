(() => {
  const START = () => import('./main.tsx').catch((error) => {
    ;(window as any).__apnaCartStartupError = String(error?.stack || error?.message || error)
    throw error
  })

  try {
    if (!('serviceWorker' in navigator)) {
      void START()
      return
    }

    const cleanup = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((registration) => registration.unregister()))
      } catch {}
      try {
        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map((key) => caches.delete(key)))
        }
      } catch {}
    }

    void Promise.race([
      cleanup(),
      new Promise<void>((resolve) => setTimeout(resolve, 2500)),
    ]).then(START)
  } catch (error) {
    ;(window as any).__apnaCartStartupError = String((error as any)?.stack || (error as any)?.message || error)
    void START()
  }
})()
