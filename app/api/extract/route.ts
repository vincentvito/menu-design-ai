import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { extractMenuItems } from '@/lib/ai/gemini'
import { scrapeUrl } from '@/lib/ai/firecrawl'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
  }

  let body: { text?: string; imageBase64?: string; mimeType?: string; url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.text && !body.imageBase64 && !body.url) {
    return NextResponse.json({ detail: 'Provide text, imageBase64, or url' }, { status: 400 })
  }

  try {
    // URL: scrape with Firecrawl first, then extract from the markdown
    if (body.url) {
      const markdown = await scrapeUrl(body.url)
      const items = await extractMenuItems({ text: markdown })
      return NextResponse.json({ items })
    }

    const items = await extractMenuItems(body)
    return NextResponse.json({ items })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed'
    return NextResponse.json({ detail: message }, { status: 500 })
  }
}
