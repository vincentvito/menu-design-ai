/**
 * One-shot script: generate a hero menu image via nano-banana-2 and save it
 * to public/showcase/hero-menu.webp.
 *
 * Run: node scripts/gen-hero-menu.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TOKEN = process.env.REPLICATE_API_TOKEN

if (!TOKEN) {
  console.error('REPLICATE_API_TOKEN env var is required')
  process.exit(1)
}

const PROMPT = `\
A stunning full-bleed Italian restaurant menu design for "Osteria Verde" — photo-rich, editorial, \
and visually lavish. The layout is inspired by high-end Italian food magazines and artisan restaurant menus.

VISUAL STYLE:
- Background: warm aged parchment or linen texture — cream, ivory, off-white — with subtle paper grain
- Decorative botanical illustrations: delicate olive branches, rosemary sprigs, and laurel wreaths \
  framing the corners and section dividers — fine-line ink-drawing style
- Typography: an elegant italic serif script for "Osteria Verde" as the hero title; \
  classic small-caps serif for section headings; clean refined serif for dish names and descriptions
- Color palette: warm ivory ground, deep espresso-brown type, terracotta and olive-green accents, \
  muted gold for price highlights
- Overall mood: a Tuscan trattoria elevated to fine-dining — warm, handcrafted, abundant

FOOD PHOTOGRAPHY — scatter these throughout the layout, each dish beautifully plated and photographed \
in natural light with shallow depth of field, rustic ceramic or linen styling:
- A bowl of burrata with heirloom tomatoes and fresh basil
- A plate of tagliatelle with black truffle shavings, glistening with butter
- A whole grilled branzino with lemon wedges and capers on a rustic plate
- A glass of tiramisù with a dusting of cocoa powder

LAYOUT: Asymmetric, editorial — food photos are large and placed near their dishes, \
not crammed into a grid. Text wraps around the images. The composition feels abundant and alive, \
like an Italian market spread across the page. Two loose columns with the title centered at top.

TEXT TO RENDER — render ONLY the strings listed below, spelled exactly as written. \
Do NOT invent any descriptions, do NOT add extra words, do NOT create sections not listed here. \
Exactly four sections: ANTIPASTI, PRIMI, SECONDI, DOLCI.

Title: "Osteria Verde"
Subtitle: "Cucina Italiana · Firenze"

"ANTIPASTI"
  "Burrata di Puglia"  €16
  "Carpaccio di Manzo"  €22

"PRIMI"
  "Tagliatelle al Tartufo"  €32
  "Risotto ai Porcini"  €28

"SECONDI"
  "Branzino alla Brace"  €38
  "Costata di Vitello"  €44

"DOLCI"
  "Tiramisù della Casa"  €12
  "Panna Cotta al Miele"  €11

Footer: "menuai.app/osteria-verde"

STRICT RULES: No invented dish descriptions. No extra sections. No duplicate listings. \
No lorem ipsum. No placeholder text. Only the exact strings above appear in the menu.

TECHNICAL: Portrait 3:4 canvas. Flat 2D graphic design — NOT a photograph of a physical menu. \
No perspective, no paper curl, no mockup. No watermarks or signatures.`

async function poll(id) {
  while (true) {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    const data = await res.json()
    console.log(`  status: ${data.status}`)
    if (data.status === 'succeeded') return data.output
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(`Prediction ${data.status}: ${data.error}`)
    }
    await new Promise((r) => setTimeout(r, 3000))
  }
}

async function main() {
  console.log('Creating prediction…')
  const res = await fetch('https://api.replicate.com/v1/models/google/nano-banana-2/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        prompt: PROMPT,
        aspect_ratio: '3:4',
        output_format: 'png',
        resolution: '2K',
      },
    }),
  })

  const prediction = await res.json()
  if (!prediction.id) {
    console.error('Failed to create prediction:', prediction)
    process.exit(1)
  }
  console.log(`Prediction id: ${prediction.id}`)

  const output = await poll(prediction.id)
  const url = Array.isArray(output) ? output[0] : output
  console.log(`Output URL: ${url}`)

  const imgRes = await fetch(url)
  const buffer = Buffer.from(await imgRes.arrayBuffer())
  const outPath = path.join(__dirname, '..', 'public', 'showcase', 'hero-menu.png')
  fs.writeFileSync(outPath, buffer)
  console.log(`Saved to ${outPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
