/**
 * Combines PNG images into a single PDF using only Node built-ins + fetch.
 * Each image becomes one page sized to match the image dimensions.
 * Run: node scripts/images-to-pdf.mjs
 */
import fs from 'fs'
import path from 'path'

const IMAGES = [
  '/mnt/c/Users/vladp/OneDrive/Pictures/Screenshots/p1 (1).png',
  '/mnt/c/Users/vladp/OneDrive/Pictures/Screenshots/p1 (2).png',
  '/mnt/c/Users/vladp/OneDrive/Pictures/Screenshots/p1 (3).png',
  '/mnt/c/Users/vladp/OneDrive/Pictures/Screenshots/p1 (4).png',
  '/mnt/c/Users/vladp/OneDrive/Pictures/Screenshots/p1 (5).png',
]

const OUT = '/mnt/c/Users/vladp/OneDrive/Pictures/Screenshots/bufalo-menu.pdf'

// Minimal PNG reader: extract width/height from IHDR chunk
function pngDimensions(buf) {
  // PNG signature is 8 bytes, then IHDR chunk: 4 len + 4 type + 4 width + 4 height
  const w = buf.readUInt32BE(16)
  const h = buf.readUInt32BE(20)
  return { w, h }
}

// Build a minimal valid PDF with embedded PNG images
function buildPdf(pages) {
  const objects = []
  const xrefs = []

  let objNum = 0
  const nextObj = () => ++objNum

  // Each page: image XObject + page dict
  const pageRefs = []
  const imageObjNums = []

  for (const { imageBytes, w, h } of pages) {
    const imgObjNum = nextObj()
    imageObjNums.push(imgObjNum)
    objects.push({
      num: imgObjNum,
      data: [
        `${imgObjNum} 0 obj`,
        `<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h}`,
        `/ColorSpace /DeviceRGB /BitsPerComponent 8`,
        `/Filter /FlateDecode /Length ${imageBytes.length} >>`,
        `stream`,
      ].join('\n'),
      stream: imageBytes,
      end: `\nendstream\nendobj`,
    })
  }

  // We'll use a simple approach: re-encode as JPEG-like by embedding raw PNG
  // Actually embed PNGs properly using /Filter /FlateDecode won't work directly.
  // Use DCTDecode for JPEG or embed PNG as-is with correct filter.
  // Simplest: convert PNG bytes -> base85/hex and use ASCIIHexDecode...
  // Actually the cleanest approach for pure Node: embed as /Filter /FlateDecode
  // won't work for PNG (it's the whole PNG file, not raw pixel data).
  //
  // Use a different strategy: write as a basic PDF with images embedded
  // using /Filter [/ASCIIHexDecode /FlateDecode] won't work either.
  //
  // Best pure-node approach: use the PNG as a JPEG by detecting it's PNG
  // and writing correct stream. Let's use a known-working minimal PDF writer
  // that embeds images as raw hex-encoded streams with correct colorspace.

  // Reset and use the correct approach
  throw new Error('use_jpeg_approach')
}

// Since embedding raw PNG in PDF is complex without a library,
// use sharp (if available) or write images as individual pages via a simple PDF structure
// that references each image as an XObject with /Filter /DCTDecode (JPEG).
//
// The cleanest zero-dep approach: write a PDF where each page contains
// the image scaled to A4, embedding PNG data with proper filtering.
//
// Let's check if sharp is available for JPEG conversion.

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

let sharp
try {
  sharp = require('sharp')
  console.log('sharp available')
} catch {
  console.log('sharp not available, trying canvas...')
  sharp = null
}

if (!sharp) {
  console.error('Need sharp or another image library. Install with: npm install sharp')
  process.exit(1)
}

async function main() {
  // Convert each PNG to JPEG bytes
  const pages = await Promise.all(
    IMAGES.map(async (imgPath) => {
      const buf = fs.readFileSync(imgPath)
      const { w, h } = pngDimensions(buf)
      const jpegBytes = await sharp(buf).jpeg({ quality: 92 }).toBuffer()
      return { w, h, jpegBytes }
    })
  )

  // Build PDF
  const parts = []
  const push = (s) => parts.push(Buffer.from(s, 'latin1'))

  push('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n')

  const offsets = []
  let objCount = 0
  const nextNum = () => ++objCount

  // Page tree will be obj 1, catalog obj 2
  // Reserve them — write content objects first

  const pageObjNums = []
  const imgObjNums = []

  const contentObjNums = []

  for (let i = 0; i < pages.length; i++) {
    const { w, h, jpegBytes } = pages[i]

    // Image XObject
    const imgNum = nextNum()
    imgObjNums.push(imgNum)
    offsets[imgNum] = Buffer.concat(parts).length
    push(`${imgNum} 0 obj\n`)
    push(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\n`)
    push('stream\n')
    parts.push(jpegBytes)
    push('\nendstream\nendobj\n')

    // Content stream: draw image to fill page
    const content = `q ${w} 0 0 ${h} 0 0 cm /Im${i} Do Q`
    const contentNum = nextNum()
    contentObjNums.push(contentNum)
    offsets[contentNum] = Buffer.concat(parts).length
    push(`${contentNum} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`)

    // Page object (placeholder — we need page tree ref, write after)
    pageObjNums.push(nextNum()) // reserve
  }

  // Page tree (obj N)
  const pageTreeNum = nextNum()
  // Write page objects now
  const pageObjectDefs = []
  for (let i = 0; i < pages.length; i++) {
    const { w, h } = pages[i]
    const pgNum = pageObjNums[i]
    offsets[pgNum] = Buffer.concat(parts).length
    const def = `${pgNum} 0 obj\n<< /Type /Page /Parent ${pageTreeNum} 0 R /MediaBox [0 0 ${w} ${h}] /Contents ${contentObjNums[i]} 0 R /Resources << /XObject << /Im${i} ${imgObjNums[i]} 0 R >> >> >>\nendobj\n`
    push(def)
  }

  // Page tree
  offsets[pageTreeNum] = Buffer.concat(parts).length
  const kidsStr = pageObjNums.map((n) => `${n} 0 R`).join(' ')
  push(`${pageTreeNum} 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${pages.length} >>\nendobj\n`)

  // Catalog
  const catalogNum = nextNum()
  offsets[catalogNum] = Buffer.concat(parts).length
  push(`${catalogNum} 0 obj\n<< /Type /Catalog /Pages ${pageTreeNum} 0 R >>\nendobj\n`)

  // xref
  const xrefOffset = Buffer.concat(parts).length
  const totalObjs = objCount + 1
  push(`xref\n0 ${totalObjs}\n`)
  push('0000000000 65535 f \n')
  for (let i = 1; i < totalObjs; i++) {
    push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`)
  }

  push(`trailer\n<< /Size ${totalObjs} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`)

  const finalBuf = Buffer.concat(parts)
  fs.writeFileSync(OUT, finalBuf)
  console.log(`✓ PDF saved to ${OUT} (${(finalBuf.length / 1024).toFixed(0)} KB, ${pages.length} pages)`)
}

main().catch((e) => { console.error(e); process.exit(1) })
