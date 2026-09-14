import fs from 'node:fs'
import path from 'node:path'

const file = path.resolve('index.html')
if (!fs.existsSync(file)) process.exit(0)

let html = fs.readFileSync(file, 'utf8')
const tag = '<script src="/seller-hub-banner.js" defer></script>'
if (!html.includes(tag)) {
  html = html.replace('    <script src="/account-page.js" defer></script>', `    ${tag}\n    <script src="/account-page.js" defer></script>`)
  fs.writeFileSync(file, html)
}
