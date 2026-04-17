import { GoogleGenerativeAI } from '@google/generative-ai'
import type { DietaryTag, MenuItem } from '@/lib/mock-data'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

const MODEL = 'gemini-3.1-flash-lite-preview'

const EXTRACTION_PROMPT = `You are a menu data extraction assistant.
Extract every dish or drink item from the provided menu content and return a JSON array.

For each item return:
{
  "name": "exact dish name as written",
  "category": "section heading it belongs to (e.g. Starters, Mains, Desserts, Drinks)",
  "price": numeric price as a number (0 if not found),
  "description": "dish description if present, otherwise empty string",
  "tags": array of applicable dietary tags from ["V","VG","GF","DF","NF"] inferred from name/description
}

Rules:
- Do not invent items not present in the source
- Do not skip any item
- If a section heading is not clear, use "Other"
- Return ONLY the raw JSON array, no markdown, no explanation`

export async function extractMenuItems(input: {
  text?: string
  imageBase64?: string
  mimeType?: string
}): Promise<MenuItem[]> {
  const model = genAI.getGenerativeModel({ model: MODEL })

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = []

  if (input.imageBase64 && input.mimeType) {
    parts.push({ inlineData: { data: input.imageBase64, mimeType: input.mimeType } })
    parts.push({ text: EXTRACTION_PROMPT + '\n\nExtract all menu items from this image.' })
  } else if (input.text) {
    parts.push({ text: EXTRACTION_PROMPT + '\n\nMenu content:\n\n' + input.text })
  } else {
    throw new Error('Provide either text or imageBase64')
  }

  const result = await model.generateContent(parts)
  const raw = result.response.text().trim()

  const jsonStr = raw.startsWith('[') ? raw : (raw.match(/\[[\s\S]*\]/) ?? [])[0]
  if (!jsonStr) throw new Error('Gemini returned no JSON array')

  const parsed = JSON.parse(jsonStr) as Array<Record<string, unknown>>

  return parsed.map((item, i) => ({
    id: `extracted-${Date.now()}-${i}`,
    name: String(item.name ?? '').trim(),
    category: String(item.category ?? 'Other').trim(),
    price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0,
    description: String(item.description ?? '').trim(),
    tags: (Array.isArray(item.tags) ? item.tags : []).filter((t): t is DietaryTag =>
      ['V', 'VG', 'GF', 'DF', 'NF'].includes(String(t)),
    ),
  }))
}
