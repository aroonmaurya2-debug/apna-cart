import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('dist-owner')
const nested = path.join(root, 'admin', 'index.html')
const target = path.join(root, 'index.html')

if (!fs.existsSync(nested)) throw new Error('Owner build entry was not generated.')

let html = fs.readFileSync(nested, 'utf8')
html = html.replaceAll('../assets/', './assets/')
html = html.replaceAll('../owner-logo.svg', './owner-logo.svg')
fs.writeFileSync(target, html)
fs.rmSync(path.join(root, 'admin'), { recursive: true, force: true })

console.log('Owner build prepared at dist-owner/index.html')
