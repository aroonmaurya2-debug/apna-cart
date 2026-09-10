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

function setupSearchTools() {
  const searchBox = document.querySelector('.search-box') as HTMLElement | null
  const input = searchBox?.querySelector('input') as HTMLInputElement | null
  if (!searchBox || !input || searchBox.querySelector('.search-action')) return

  const makeButton = (label: string, icon: string, title: string) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'search-action'
    button.setAttribute('aria-label', label)
    button.title = title
    button.textContent = icon
    return button
  }

  const mic = makeButton('Voice search', '🎙️', 'Voice search')
  const camera = makeButton('Search with camera', '📷', 'Search with camera')
  const cameraInput = document.createElement('input')
  cameraInput.type = 'file'
  cameraInput.accept = 'image/*'
  cameraInput.setAttribute('capture', 'environment')
  cameraInput.style.display = 'none'

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

  camera.addEventListener('click', () => cameraInput.click())
  cameraInput.addEventListener('change', () => {
    if (cameraInput.files?.length) {
      const file = cameraInput.files[0]
      input.placeholder = `Photo selected: ${file.name}`
    }
  })

  searchBox.append(mic, camera, cameraInput)
}

if (typeof window !== 'undefined') {
  const observer = new MutationObserver(() => setupSearchTools())
  observer.observe(document.body, { childList: true, subtree: true })
  window.addEventListener('load', setupSearchTools)
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js?v=13`, { updateViaCache: 'none' }).catch(() => undefined)
  })
}
