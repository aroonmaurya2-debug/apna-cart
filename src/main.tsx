import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './home-fix.css'
import './home-mobile.css'
import App from './AppFixed.tsx'
import MarketplaceFeatures from './MarketplaceFeatures.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <MarketplaceFeatures />
  </StrictMode>,
)

function setupSearchTools() {
  const searchBox = document.querySelector('.search-box') as HTMLElement | null
  const input = searchBox?.querySelector('input') as HTMLInputElement | null
  if (!searchBox || !input) return

  const mic = searchBox.querySelector('button[aria-label="Voice search"]') as HTMLButtonElement | null
  const camera = searchBox.querySelector('button[aria-label="Camera search"], button[aria-label="Search with camera"]') as HTMLButtonElement | null
  if (!mic || !camera) return
  mic.classList.add('search-action')
  camera.classList.add('search-action')

  if (!mic.dataset.voiceBound) {
    mic.dataset.voiceBound = 'true'
    mic.title = 'Voice search'
    mic.addEventListener('click', () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        alert('Voice typing is not supported in this browser.')
        return
      }
      const recognition = new SpeechRecognition()
      recognition.lang = 'hi-IN'
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognition.onresult = (event: any) => {
        const text = event.results?.[0]?.[0]?.transcript || ''
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
        setter?.call(input, text)
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
      recognition.onerror = () => undefined
      recognition.start()
    })
  }

  if (!camera.dataset.cameraBound) {
    camera.dataset.cameraBound = 'true'
    camera.title = 'Search with camera'
    let cameraInput = searchBox.querySelector('.camera-capture-input') as HTMLInputElement | null
    if (!cameraInput) {
      cameraInput = document.createElement('input')
      cameraInput.type = 'file'
      cameraInput.accept = 'image/*'
      cameraInput.setAttribute('capture', 'environment')
      cameraInput.className = 'camera-capture-input'
      cameraInput.style.display = 'none'
      cameraInput.addEventListener('change', () => {
        if (cameraInput?.files?.length) {
          const file = cameraInput.files[0]
          input.placeholder = `Photo selected: ${file.name}`
        }
      })
      searchBox.appendChild(cameraInput)
    }
    camera.addEventListener('click', () => cameraInput?.click())
  }
}

function setupReferenceHome() {
  const hero = document.querySelector('.hero-banner') as HTMLElement | null
  if (hero && !hero.dataset.swipeReady) {
    const originalButton = hero.querySelector('button') as HTMLButtonElement | null
    const carousel = document.createElement('div')
    carousel.className = 'hero-swipe'
    carousel.dataset.swipeReady = 'true'
    const slides = [hero, hero.cloneNode(true) as HTMLElement, hero.cloneNode(true) as HTMLElement]
    const titles = [
      ['Best Quality', 'Lowest Prices', 'Fashion  |  Home  |  Beauty  |  More'],
      ['Great Deals', 'Everyday Value', 'Fashion  |  Home  |  Beauty  |  More'],
      ['Apna Cart', 'Har Ghar Ki Zarurat', 'Shop smart  |  Save more  |  Easy shopping'],
    ]
    slides.forEach((slide, index) => {
      slide.dataset.swipeReady = 'true'
      const h1 = slide.querySelector('h1')
      const p = slide.querySelector('p')
      if (h1) h1.innerHTML = `${titles[index][0]}<br /><b>${titles[index][1]}</b>`
      if (p) p.textContent = titles[index][2]
      const button = slide.querySelector('button') as HTMLButtonElement | null
      if (index > 0 && button && originalButton) button.addEventListener('click', () => originalButton.click())
      carousel.appendChild(slide)
    })
    hero.replaceWith(carousel)
  }

  const categories = document.querySelector('.category-strip') as HTMLElement | null
  if (categories) categories.dataset.swipeReady = 'true'

  const headerLine = document.querySelector('.header-topline') as HTMLElement | null
  if (headerLine && !headerLine.querySelector('.notification-head')) {
    const cart = headerLine.querySelector('.cart-head')
    const bell = document.createElement('button')
    bell.type = 'button'
    bell.className = 'header-icon notification-head'
    bell.setAttribute('aria-label', 'Notifications')
    bell.title = 'Notifications'
    bell.textContent = '🔔'
    bell.addEventListener('click', () => alert('No new notifications'))
    if (cart) headerLine.insertBefore(bell, cart)
    else headerLine.appendChild(bell)
  }
}

if (typeof window !== 'undefined') {
  const observer = new MutationObserver(() => {
    setupSearchTools()
    setupReferenceHome()
  })
  observer.observe(document.body, { childList: true, subtree: true })
  window.addEventListener('load', () => {
    setupSearchTools()
    setupReferenceHome()
  })
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js?v=15`, { updateViaCache: 'none' }).catch(() => undefined)
  })
}
