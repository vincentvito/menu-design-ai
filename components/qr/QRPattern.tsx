import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface QRPatternProps {
  seed: string
  className?: string
  fg?: string
  bg?: string
  label?: string
}

/**
 * Deterministic "QR-like" SVG pattern seeded from a string. NOT a scannable
 * code — visual placeholder only. The real QR (pointing at /menu/{slug})
 * is rendered at publish time on the backend.
 */
export function QRPattern({
  seed,
  className,
  fg = 'var(--color-g800)',
  bg = '#ffffff',
  label = 'QR code preview (not scannable)',
}: QRPatternProps) {
  const size = 17
  const cells = useMemo(() => pseudoRandomGrid(seed, size), [seed])

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn('h-full w-full', className)}
      role="img"
      aria-label={label}
    >
      <rect width={size} height={size} fill={bg} />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fg} />
      ))}
      {[
        [0, 0],
        [size - 7, 0],
        [0, size - 7],
      ].map(([x, y]) => (
        <g key={`f-${x}-${y}`} fill={fg}>
          <rect x={x} y={y} width={7} height={7} />
          <rect x={x + 1} y={y + 1} width={5} height={5} fill={bg} />
          <rect x={x + 2} y={y + 2} width={3} height={3} />
        </g>
      ))}
    </svg>
  )
}

function pseudoRandomGrid(seed: string, size: number): [number, number][] {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const out: [number, number][] = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // skip finder-pattern zones
      if (inFinder(x, y, size)) continue
      h = Math.imul(h ^ (x * 73856093) ^ (y * 19349663), 1274126177)
      if ((h & 0xff) > 128) out.push([x, y])
    }
  }
  return out
}

function inFinder(x: number, y: number, size: number) {
  const top = y < 8
  const bottom = y > size - 9
  const left = x < 8
  const right = x > size - 9
  return (top && left) || (top && right) || (bottom && left)
}
