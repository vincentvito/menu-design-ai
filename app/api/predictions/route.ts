import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateMenuImage } from '@/lib/ai/gemini-image'
import { aspectRatioForFormat, buildReplicatePrompt } from '@/lib/ai/menu-prompts'
import { VARIANTS } from '@/lib/ai/variants'
import { keyForPrediction, publicUrl } from '@/lib/storage/r2'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { MenuConfig } from '@/lib/menu-config/types'
import type { MenuItem } from '@/lib/mock-data'

export const runtime = 'nodejs'
// Gemini image generation can take ~30s per image; 4 in parallel needs headroom.
export const maxDuration = 180

interface GenerateRequestBody {
  config: MenuConfig
  items: MenuItem[]
}

function r2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_BUCKET_API!,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
    },
  })
}

async function uploadBase64(
  base64: string,
  mimeType: string,
  designId: string,
  predictionId: string,
): Promise<string> {
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png'
  const key = keyForPrediction(designId, predictionId, ext)
  const buffer = Buffer.from(base64, 'base64')

  await r2Client().send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )

  return publicUrl(key)
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { detail: 'GOOGLE_GENERATIVE_AI_API_KEY is not set.' },
      { status: 500 },
    )
  }

  let body: GenerateRequestBody
  try {
    body = (await request.json()) as GenerateRequestBody
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body.' }, { status: 400 })
  }

  const { config, items } = body
  if (!config || !Array.isArray(items)) {
    return NextResponse.json({ detail: 'Body must include { config, items }.' }, { status: 400 })
  }

  // Filter items to only the sections the user selected (case-insensitive match)
  const selectedSections = config.structure?.sections ?? []
  const filteredItems =
    selectedSections.length === 0
      ? items
      : items.filter((it: MenuItem) =>
          selectedSections.some(
            (s: string) => s.trim().toLowerCase() === (it.category ?? '').trim().toLowerCase(),
          ),
        )

  const prompts = VARIANTS.map((variant) => buildReplicatePrompt(config, filteredItems, variant))

  const design = await prisma.menuDesign.create({
    data: {
      userId: session.user.id,
      config: config as unknown as object,
      items: filteredItems as unknown as object,
    },
  })

  try {
    // Generate both variants in parallel via Gemini
    const results = await Promise.all(
      VARIANTS.map(async (variant, i) => {
        const predictionId = `gemini-${design.id}-${variant.id}-${Date.now()}`
        try {
          const image = await generateMenuImage(prompts[i])
          const storageUrl = await uploadBase64(
            image.base64,
            image.mimeType,
            design.id,
            predictionId,
          )
          return { predictionId, storageUrl, error: null }
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Generation failed'
          return { predictionId, storageUrl: null, error }
        }
      }),
    )

    // Persist prediction rows with final status
    await prisma.prediction.createMany({
      data: results.map((r, i) => ({
        id: r.predictionId,
        designId: design.id,
        variantId: VARIANTS[i].id,
        variantLabel: VARIANTS[i].label,
        status: r.storageUrl ? 'succeeded' : 'failed',
        prompt: prompts[i],
        storageUrl: r.storageUrl,
        error: r.error,
      })),
    })

    return NextResponse.json(
      {
        designId: design.id,
        predictions: results.map((r, i) => ({
          id: r.predictionId,
          status: r.storageUrl ? 'succeeded' : 'failed',
          output: r.storageUrl,
          error: r.error,
          variant: VARIANTS[i],
        })),
      },
      { status: 201 },
    )
  } catch (err) {
    await prisma.menuDesign.delete({ where: { id: design.id } }).catch(() => {})
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ detail: message }, { status: 500 })
  }
}
