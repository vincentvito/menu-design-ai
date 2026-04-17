/**
 * One-shot: generate the OG image (1200×630) via nano-banana-2.
 * Run: node scripts/gen-og-image.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TOKEN = process.env.REPLICATE_API_TOKEN
if (!TOKEN) { console.error('REPLICATE_API_TOKEN required'); process.exit(1) }

const PROMPT = `\
A stunning social-media preview image (OG image) for "MenuAI", an AI-powered restaurant menu design app.

LAYOUT: Landscape 16:9 composition. Left half shows a beautiful open restaurant menu — \
a dark atmospheric Italian fine-dining menu with food photography, gold typography, \
and botanical illustrations on a deep charcoal background. \
Right half has a clean cream background with the following text elements:

TEXT TO RENDER exactly as written:
- Large bold serif wordmark: "MenuAI"  (the "AI" part in amber/gold color)
- Tagline below: "Restaurant menus, designed by AI"
- Small supporting line: "Print-ready PDF · Hosted QR menu · 60 seconds"

STYLE: The overall image feels premium and editorial. \
The menu on the left is luxurious and photo-rich. \
The right side is clean, minimal, confident. \
Color palette: deep charcoal, warm cream, amber gold. \
No UI chrome, no browser windows, no device frames. Flat graphic composition.

Do not add any other text. Do not add watermarks or signatures.`

async function poll(id) {
  while (true) {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    const data = await res.json()
    process.stdout.write(`\r  status: ${data.status}   `)
    if (data.status === 'succeeded') { console.log(); return data.output }
    if (data.status === 'failed' || data.status === 'canceled') throw new Error(data.error)
    await new Promise(r => setTimeout(r, 3000))
  }
}

const res = await fetch('https://api.replicate.com/v1/models/google/nano-banana-2/predictions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: { prompt: PROMPT, aspect_ratio: '16:9', output_format: 'png', resolution: '2K' } }),
})
const prediction = await res.json()
if (!prediction.id) { console.error(prediction); process.exit(1) }
console.log(`id: ${prediction.id}`)

const output = await poll(prediction.id)
const url = Array.isArray(output) ? output[0] : output
const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
const out = path.join(__dirname, '..', 'public', 'og-image.png')
fs.writeFileSync(out, buf)
console.log(`Saved → ${out}`)
