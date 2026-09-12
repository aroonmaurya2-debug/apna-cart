import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './AppFixed.tsx'
import './index.css'
import './home-fix.css'
import './home-mobile.css'
import './home-match.css'
import './home-reference.css'
import './home-premium.css'

type State = { error: unknown }

class StartupBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: unknown): State { return { error } }
  componentDidCatch(error: unknown, info: ErrorInfo) { console.error('Apna Cart startup error:', error, info) }
  render() {
    if (this.state.error) {
      const error = this.state.error instanceof Error ? this.state.error : new Error(String(this.state.error))
      return <main style={{ minHeight:'100vh', display:'grid', placeItems:'center', padding:24, fontFamily:'system-ui' }}><div style={{ maxWidth:720, textAlign:'center' }}><h2>Apna Cart</h2><p>App start nahi ho pa raha hai.</p><pre style={{ whiteSpace:'pre-wrap', textAlign:'left', background:'#f5f5f5', padding:16, borderRadius:12, overflow:'auto' }}>{error.stack || error.message}</pre><button onClick={()=>location.reload()} style={{ padding:'10px 18px', borderRadius:10, border:0, cursor:'pointer' }}>Reload</button></div></main>
    }
    return this.props.children
  }
}

const root = document.getElementById('root')
if (!root) throw new Error('Apna Cart root element missing')

createRoot(root).render(
  <StrictMode>
    <StartupBoundary>
      <App />
    </StartupBoundary>
  </StrictMode>,
)
