import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { MENU_MODEL, replicate } from '@/lib/ai/replicate'
import {
  aspectRatioForFormat,
  buildReplicatePrompt,
  DEFAULT_NEGATIVE_PROMPT,
} from '@/lib/ai/menu-prompts'
import { VARIANTS } from '@/lib/ai/variants'
import type { MenuConfig } from '@/lib/menu-config/types'
import type { MenuItem } from '@/lib/mock-data'

export const runtime = 'nodejs'

interface GenerateRequestBody {
  config: MenuConfig
  items: MenuItem[]
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { detail: 'REPLICATE_API_TOKEN is not set on the server.' },
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

  const baseInput = {
    aspect_ratio: aspectRatioForFormat(config.format),
    negative_prompt: DEFAULT_NEGATIVE_PROMPT,
    // Disable prompt expansion: we're providing explicit text to render,
    // and expansion would rewrite our literal quoted strings.
    enable_prompt_expansion: false,
  }

  // Build prompts up front so we can persist them alongside the prediction rows.
  const prompts = VARIANTS.map((variant) => buildReplicatePrompt(config, items, variant))

  // Create the MenuDesign shell first; we'll fill in prediction rows once
  // Replicate returns ids.
  const design = await prisma.menuDesign.create({
    data: {
      userId: session.user.id,
      config: config as unknown as object,
      items: items as unknown as object,
    },
  })

  try {
    const predictions = await Promise.all(
      VARIANTS.map((variant, i) =>
        replicate.predictions.create({
          model: MENU_MODEL,
          input: { ...baseInput, prompt: prompts[i] },
        }),
      ),
    )

    await prisma.prediction.createMany({
      data: predictions.map((p, i) => ({
        id: p.id,
        designId: design.id,
        variantId: VARIANTS[i].id,
        variantLabel: VARIANTS[i].label,
        status: p.status,
        prompt: prompts[i],
      })),
    })

    return NextResponse.json(
      {
        designId: design.id,
        predictions: predictions.map((p, i) => ({
          id: p.id,
          status: p.status,
          variant: VARIANTS[i],
        })),
      },
      { status: 201 },
    )
  } catch (err) {
    // Replicate call failed — clean up the empty design shell so we don't leak rows.
    await prisma.menuDesign.delete({ where: { id: design.id } }).catch(() => {})
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ detail: message }, { status: 500 })
  }
}
