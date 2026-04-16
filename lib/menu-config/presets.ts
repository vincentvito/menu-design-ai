/**
 * Preset option lists for the menu configuration wizard.
 *
 * Each list is a starting point — the UI always pairs these with a free-text
 * "write your own" input so unusual concepts (e.g. "Nikkei fusion", "Tokyo
 * convenience store aesthetic") can be piped straight into the prompt.
 */

export interface Preset {
  id: string
  label: string
  /** Optional short hint shown under the label in pickers. */
  hint?: string
}

export const CUISINE_PRESETS: Preset[] = [
  { id: 'chinese', label: 'Chinese', hint: 'Sichuan, Cantonese, Hunan…' },
  { id: 'japanese', label: 'Japanese', hint: 'Kaiseki, izakaya, sushi…' },
  { id: 'korean', label: 'Korean' },
  { id: 'thai', label: 'Thai' },
  { id: 'vietnamese', label: 'Vietnamese' },
  { id: 'indian', label: 'Indian', hint: 'North, South, Goan…' },
  { id: 'mexican', label: 'Mexican', hint: 'Oaxacan, Yucatecan…' },
  { id: 'peruvian', label: 'Peruvian' },
  { id: 'brazilian', label: 'Brazilian' },
  { id: 'italian', label: 'Italian', hint: 'Neapolitan, Roman, Tuscan…' },
  { id: 'french', label: 'French', hint: 'Bistro, haute cuisine…' },
  { id: 'spanish', label: 'Spanish', hint: 'Basque, Andalusian…' },
  { id: 'greek', label: 'Greek' },
  { id: 'mediterranean', label: 'Mediterranean' },
  { id: 'middle-eastern', label: 'Middle Eastern' },
  { id: 'american', label: 'American' },
  { id: 'southern-bbq', label: 'Southern BBQ' },
  { id: 'seafood', label: 'Seafood' },
  { id: 'steakhouse', label: 'Steakhouse' },
]

export const RESTAURANT_TYPE_PRESETS: Preset[] = [
  { id: 'fine-dining', label: 'Fine dining', hint: 'Sparse, generous whitespace' },
  { id: 'casual-dining', label: 'Casual dining' },
  { id: 'fast-casual', label: 'Fast casual' },
  { id: 'fast-food', label: 'Fast food', hint: 'High-density scannable grid' },
  { id: 'cafe-bistro', label: 'Café / Bistro' },
  { id: 'brasserie', label: 'Brasserie' },
  { id: 'izakaya', label: 'Izakaya' },
  { id: 'tapas-bar', label: 'Tapas bar' },
  { id: 'food-truck', label: 'Food truck' },
  { id: 'pop-up', label: 'Pop-up' },
  { id: 'hotel-restaurant', label: 'Hotel restaurant' },
  { id: 'private-club', label: 'Private club' },
]

export const VIBE_PRESETS: Preset[] = [
  { id: 'luxury', label: 'Luxury / White-tablecloth' },
  { id: 'rustic', label: 'Rustic / Farmhouse' },
  { id: 'authentic', label: 'Authentic / Traditional' },
  { id: 'hipster', label: 'Hipster / Independent' },
  { id: 'minimalist', label: 'Minimalist / Zen' },
  { id: 'dark-moody', label: 'Dark & Moody' },
  { id: 'bright-playful', label: 'Bright & Playful' },
  { id: 'industrial', label: 'Industrial / Urban' },
  { id: 'coastal', label: 'Coastal / Breezy' },
  { id: 'retro', label: 'Retro / Nostalgic' },
  { id: 'romantic', label: 'Romantic' },
  { id: 'family-friendly', label: 'Family-friendly' },
]

export const PALETTE_PRESETS: Preset[] = [
  { id: 'warm-earthy', label: 'Warm & Earthy' },
  { id: 'cool-minimal', label: 'Cool & Minimal' },
  { id: 'bold-graphic', label: 'Bold & Graphic' },
  { id: 'dark-moody', label: 'Dark & Moody' },
  { id: 'pastel-soft', label: 'Pastel & Soft' },
  { id: 'high-contrast', label: 'High Contrast / B&W' },
]

export const COPY_TONE_PRESETS: Preset[] = [
  {
    id: 'precise-clinical',
    label: 'Precise & Clinical',
    hint: '“12oz dry-aged ribeye, 28-day hang”',
  },
  {
    id: 'poetic-evocative',
    label: 'Poetic & Evocative',
    hint: '“slow-kissed short rib, ember-roasted root”',
  },
  {
    id: 'warm-friendly',
    label: 'Warm & Friendly',
    hint: '“our take on a classic — you’ll love it”',
  },
  {
    id: 'playful-casual',
    label: 'Playful & Casual',
    hint: '“the best burger we’ve ever made, no notes”',
  },
  {
    id: 'luxurious-formal',
    label: 'Luxurious & Formal',
    hint: '“a delicate composition of…”',
  },
]

export const CONTENT_DENSITY_PRESETS: Preset[] = [
  { id: 'text-only', label: 'Text only' },
  { id: 'text-accents', label: 'Text + small decorative accents' },
  {
    id: 'text-imagery',
    label: 'Text + prominent imagery',
    hint: 'Real food photography strongly recommended',
  },
]

export const PRICE_DISPLAY_PRESETS: Preset[] = [
  { id: 'symbol', label: 'With currency symbol ($–$$$)' },
  { id: 'numeric', label: 'Numeric only (no symbol)' },
  { id: 'hidden', label: 'Hidden (prix fixe / omakase)' },
]

export const LANGUAGE_PRESETS: Preset[] = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Spanish' },
  { id: 'fr', label: 'French' },
  { id: 'it', label: 'Italian' },
  { id: 'de', label: 'German' },
  { id: 'pt', label: 'Portuguese' },
  { id: 'ja', label: 'Japanese' },
  { id: 'zh', label: 'Chinese' },
  { id: 'ko', label: 'Korean' },
  { id: 'ar', label: 'Arabic (RTL)' },
]

/** Languages that require right-to-left layout. */
export const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur'])

export const MENU_FORMAT_PRESETS: Preset[] = [
  { id: 'a4', label: 'A4 (210 × 297 mm)' },
  // { id: '1x1', label: 'Square (1:1)' },
  // { id: '4-5', label: 'Portrait (4:5)' },
]
