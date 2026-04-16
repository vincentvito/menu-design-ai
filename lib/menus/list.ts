import 'server-only'
import prisma from '@/lib/prisma'
import type { MenuConfig } from '@/lib/menu-config/types'
import type { MenuItem } from '@/lib/mock-data'

export interface MenuSummary {
  id: string
  name: string
  style: string
  itemCount: number
  updatedAt: string
  status: 'active' | 'print-ready' | 'draft'
  qrEnabled: boolean
  colorScheme: 'dark' | 'cream' | 'white' | 'photo'
  thumbUrl: string | null
}

export async function listUserMenus(userId: string, limit?: number): Promise<MenuSummary[]> {
  const designs = await prisma.menuDesign.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    include: {
      predictions: {
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  })

  return designs.map((design) => {
    const config = design.config as unknown as MenuConfig
    const items = Array.isArray(design.items) ? (design.items as unknown as MenuItem[]) : []
    const prediction = design.predictions[0]
    const thumbUrl = prediction?.storageUrl ?? prediction?.replicateUrl ?? null
    const status: MenuSummary['status'] = prediction?.status === 'succeeded' ? 'active' : 'draft'

    return {
      id: design.id,
      name: config?.restaurantName?.trim() || 'Untitled menu',
      style: deriveStyle(config),
      itemCount: items.length,
      updatedAt: design.updatedAt.toISOString(),
      status,
      qrEnabled: false,
      colorScheme: deriveColorScheme(config),
      thumbUrl,
    }
  })
}

function deriveStyle(config: MenuConfig | null | undefined): string {
  if (!config) return 'Classic'
  const vibe = config.vibe?.value
  if (vibe) return titleCase(vibe.replace(/[-_]/g, ' '))
  if (config.contentDensity === 'text-only') return 'Minimal'
  if (config.contentDensity === 'text-imagery') return 'Rich imagery'
  return 'Classic'
}

function deriveColorScheme(config: MenuConfig | null | undefined): MenuSummary['colorScheme'] {
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
