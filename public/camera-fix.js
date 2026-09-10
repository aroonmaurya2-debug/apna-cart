(() => {
  const run = () => {
    if (document.documentElement.dataset.apnaCameraFix === '1') return
    document.documentElement.dataset.apnaCameraFix = '1'
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'; input.setAttribute('capture', 'environment')
    input.style.display = 'none'; input.id = 'apna-camera-fix-input'
    document.body.appendChild(input)
    const gallery = document.createElement('input')
    gallery.type = 'file'; gallery.accept = 'image/*'; gallery.style.display = 'none'; gallery.id = 'apna-gallery-fix-input'
    document.body.appendChild(gallery)
    const openChooser = () => {
      document.querySelectorAll('.apna-camera-fix-menu').forEach(el => el.remove())
      const menu = document.createElement('div'); menu.className = 'apna-camera-fix-menu'
      menu.innerHTML = '<div class="apna-camera-fix-card"><b>Search with image</b><button data-camera>📷 Camera</button><button data-gallery>🖼️ Gallery</button><button data-close>Cancel</button></div>'
      Object.assign(menu.style, { position:'fixed', inset:'0', zIndex:'2147483647', background:'rgba(0,0,0,.38)', display:'grid', placeItems:'end center', padding:'18px' })
      const card = menu.firstElementChild
      Object.assign(card.style, { width:'min(100%,380px)', background:'#fff', borderRadius:'18px', padding:'16px', boxShadow:'0 18px 45px rgba(0,0,0,.25)', fontFamily:'system-ui,sans-serif' })
      card.querySelectorAll('button').forEach(btn => Object.assign(btn.style, { width:'100%', padding:'13px', marginTop:'8px', border:'1px solid #cfe8db', borderRadius:'12px', background:'#f5fcf8', color:'#08794d', fontWeight:'800', fontSize:'15px' }))
      card.querySelector('[data-camera]').onclick = () => { menu.remove(); input.click() }
      card.querySelector('[data-gallery]').onclick = () => { menu.remove(); gallery.click() }
      card.querySelector('[data-close]').onclick = () => menu.remove()
      menu.onclick = e => { if (e.target === menu) menu.remove() }
      document.body.appendChild(menu)
    }
    document.addEventListener('click', e => {
      const button = e.target.closest?.('button[aria-label="Camera search"],button[aria-label="Search with camera"]')
      if (!button) return
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); openChooser()
    }, true)
    const forwardFile = file => {
      if (!file) return
      const box = document.querySelector('.search-box'); const textInput = box?.querySelector('input')
      if (!textInput) return
      const name = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      if (set) set.call(textInput, name); else textInput.value = name
      textInput.dispatchEvent(new Event('input', { bubbles:true })); textInput.dispatchEvent(new Event('change', { bubbles:true }))
    }
    input.addEventListener('change', () => { forwardFile(input.files?.[0]); input.value = '' })
    gallery.addEventListener('change', () => { forwardFile(gallery.files?.[0]); gallery.value = '' })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once:true }); else run()
})()
