import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './home-fix.css'
import './home-mobile.css'
import './home-match.css'
import App from './AppFixed.tsx'

const root = document.getElementById('root')
if (!root) throw new Error('Apna Cart root element missing')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
