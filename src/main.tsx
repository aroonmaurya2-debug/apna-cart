import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './home-fix.css'
import App from './AppFixed.tsx'
import MarketplaceFeatures from './MarketplaceFeatures.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <MarketplaceFeatures />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js?v=12`, { updateViaCache: 'none' }).catch(() => undefined)
  })
}
