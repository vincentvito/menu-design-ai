import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { replicate } from '@/lib/ai/replicate'
import { extFromUrlOrType, keyForPrediction, uploadFromUrl } from '@/lib/storage/r2'

export const runtime = 'nodejs'

/** Terminal Replicate statuses — no point polling after these. */
const TERMINAL = new Set(['succeeded', 'failed', 'canceled'])

/** Normalize Replicate's output (string | string[] | null) to a single URL. */
function extractUrl(output: unknown): string | null {
  if (!output) return null
  if (typeof output === 'string') return output
  if (Array.isArray(output) && typeof output[0] === 'string') return output[0]
  return null
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  // Load the persisted prediction + its design so we can verify ownership and
  // short-circuit when we've already uploaded to R2.
  const row = await prisma.prediction.findUnique({
    where: { id },
    include: { design: { select: { userId: true } } },
  })
  if (!row || row.design.userId !== session.user.id) {
    return NextResponse.json({ detail: 'Not found' }, { status: 404 })
  }

  // Already finalized: return the permanent URL directly, no Replicate hit.
  if (row.status === 'succeeded' && row.storageUrl) {
    return NextResponse.json({
      id: row.id,
      status: row.status,
      output: row.storageUrl,
      error: null,
    })
  }
  if (row.status === 'failed' || row.status === 'canceled') {
    return NextResponse.json({
      id: row.id,
      status: row.status,
      output: null,
      error: row.error,
    })
  }

  try {
    const prediction = await replicate.predictions.get(id)
    const status = prediction.status
    const replicateUrl = extractUrl(prediction.output)
    const error = prediction.error ? String(prediction.error) : null

    let storageUrl: string | null = row.storageUrl
    let storageKey: string | null = row.storageKey

    // First time we see success and don't yet have R2 copy → upload.
    if (status === 'succeeded' && replicateUrl && !storageUrl) {
      try {
        const ext = extFromUrlOrType(replicateUrl, null)
        const key = keyForPrediction(row.designId, row.id, ext)
        const uploaded = await uploadFromUrl(replicateUrl, key)
        storageKey = uploaded.key
        storageUrl = uploaded.url
      } catch (uploadErr) {
        // Uploading to R2 failed — surface as a failure on our side but keep
        // the Replicate URL in the DB for debugging.
        const message = uploadErr instanceof Error ? uploadErr.message : 'Storage upload failed'
        await prisma.prediction.update({
          where: { id },
          data: {
            status: 'failed',
            replicateUrl,
            error: `Storage error: ${message}`,
          },
        })
        return NextResponse.json({
          id,
          status: 'failed',
          output: null,
          error: `Storage error: ${message}`,
        })
      }
    }

    // Persist whatever we learned on this poll.
    if (TERMINAL.has(status) || status !== row.status) {
      await prisma.prediction.update({
        where: { id },
        data: {
          status,
          replicateUrl: replicateUrl ?? row.replicateUrl,
          storageKey,
          storageUrl,
          error,
        },
      })
    }

    return NextResponse.json({
      id,
      status,
      // Prefer the permanent URL; fall back to Replicate only until upload lands.
      output: storageUrl ?? replicateUrl,
      error,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ detail: message }, { status: 500 })
  }
}
