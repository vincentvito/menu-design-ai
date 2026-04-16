/**
 * JavaScript mirror of the MenuAI design tokens declared in
 * `app/globals.css` (`@theme` block). Single source of truth is still the
 * CSS — these constants exist only for the few cases where we need to
 * reference a brand color from JS:
 *
 *   - array indexing (e.g., author avatar colors, palette swatches)
 *   - inline `style={{ background: ... }}` where `var(--color-*)` is
 *     awkward or unsupported (SVG `fill`, canvas, etc.)
 *
 * Whenever possible, prefer Tailwind utilities (`bg-g800`, `text-amber`)
 * or CSS custom properties (`style={{ background: 'var(--color-g800)' }}`)
 * over importing from this file.
 */

export const brand = {
  g900: '#0d1f14',
  g800: '#1c3829',
  g700: '#2a5240',
  g600: '#3d7059',
  g200: '#b8ccbf',
  g100: '#dce8df',
  g50: '#f2f7f3',

  amber: '#c9922a',
  amberL: '#f7edd9',

  cream: '#faf8f3',
  text: '#1a2e20',
  text2: '#4d6355',
  text3: '#6e8377',
  brandBorder: '#dee8e1',

  amberInk: '#4a2e05', // text color on amber surfaces
} as const

export type BrandColor = keyof typeof brand

/** Ordered set of brand accents used for avatar/author color rotations. */
export const brandAccents = [brand.amber, brand.g600, brand.g200, brand.amberInk] as const
