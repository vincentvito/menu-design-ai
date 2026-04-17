import 'server-only'
import prisma from '@/lib/prisma'
import type { MenuConfig } from '@/lib/menu-config/types'
import type { MenuItem } from '@/lib/mock-data'

export interface MenuPreviewImage {
  id: string
  variantId: string
  variantLabel: string
  status: string
  imageUrl: string | null
  error: string | null
}

export interface MenuDetail {
  id: string
  name: string
  style: string
  status: 'active' | 'print-ready' | 'draft'
  colorScheme: 'dark' | 'cream' | 'white' | 'photo'
  updatedAt: string
  createdAt: string
  config: MenuConfig
  items: MenuItem[]
  predictions: MenuPreviewImage[]
}

export async function getMenuDetail(id: string, userId: string): Promise<MenuDetail | null> {
  const design = await prisma.menuDesign.findFirst({
    where: { id, userId },
    include: {
      predictions: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!design) return null

  const config = design.config as unknown as MenuConfig
  const items = Array.isArray(design.items) ? (design.items as unknown as MenuItem[]) : []
  const predictions: MenuPreviewImage[] = design.predictions.map((p) => ({
    id: p.id,
    variantId: p.variantId,
    variantLabel: p.variantLabel,
    status: p.status,
    imageUrl: p.storageUrl ?? p.replicateUrl ?? null,
    error: p.error,
  }))

  const primary = predictions.find((p) => p.status === 'succeeded' && p.imageUrl)
  const status: MenuDetail['status'] = primary ? 'active' : 'draft'

  return {
    id: design.id,
    name: config?.restaurantName?.trim() || 'Untitled menu',
    style: deriveStyle(config),
    status,
    colorScheme: deriveColorScheme(config),
    updatedAt: design.updatedAt.toISOString(),
    createdAt: design.createdAt.toISOString(),
    config,
    items,
    predictions,
  }
}

function deriveStyle(config: MenuConfig | null | undefined): string {
  if (!config) return 'Classic'
  const vibe = config.vibe?.value
  if (vibe) return titleCase(vibe.replace(/[-_]/g, ' '))
  if (config.contentDensity === 'text-only') return 'Minimal'
  if (config.contentDensity === 'text-imagery') return 'Rich imagery'
  return 'Classic'
}

function deriveColorScheme(config: MenuConfig | null | undefined): MenuDetail['colorScheme'] {
  const palette = config?.palette?.value?.toLowerCase() ?? ''
  if (palette.includes('dark') || palette.includes('moody') || palette.includes('black'))
    return 'dark'
  if (palette.includes('cream') || palette.includes('warm') || palette.includes('paper'))
    return 'cream'
  if (palette.includes('photo') || palette.includes('image')) return 'photo'
  return 'white'
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
}
