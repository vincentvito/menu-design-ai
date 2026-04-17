/**
 * Preset option lists for the menu configuration wizard.
 *
 * Each list is a starting point — the UI always pairs these with a free-text
 * "write your own" input so unusual concepts (e.g. "Nikkei fusion", "Tokyo
 * convenience store aesthetic") can be piped straight into the prompt.
 *
 * `hint` is UI-only copy shown under the label in pickers.
 * `directive` is prompt-only — concrete typographic / compositional guidance
 * that gets inlined into the Replicate prompt so the model has specific,
 * opinionated visual character to work from (not just a label).
 */

export interface Preset {
  id: string
  label: string
  /** Short hint shown under the label in pickers (UI only). */
  hint?: string
  /** Long-form visual directive inlined into the AI prompt (prompt only). */
  directive?: string
}

export const CUISINE_PRESETS: Preset[] = [
  {
    id: 'chinese',
    label: 'Chinese',
    hint: 'Sichuan, Cantonese, Hunan…',
    directive:
      'Chinese visual heritage: draw from lacquerware reds and golds, silk textile patterns, or ink-wash minimalism depending on register. ' +
      'Dense, layered layouts feel native to the cuisine; ornamental border motifs and bold color fields are welcome. ' +
      'Script or brushstroke display lettering adds authenticity when used with restraint.',
  },
  {
    id: 'japanese',
    label: 'Japanese',
    hint: 'Kaiseki, izakaya, sushi…',
    directive:
      'Japanese visual sensibility: ma (negative space) is a design material, not an absence. ' +
      'Restraint governs — a single strong typographic choice, deliberate asymmetry, and quiet tonal palettes inspired by washi, ink, or ceramic glazes. ' +
      'Where appropriate, vertical type orientation or subtle brushwork accents honor the tradition without pastiche.',
  },
  {
    id: 'korean',
    label: 'Korean',
    directive:
      'Korean visual energy: bold, contemporary, and confident. ' +
      'Draw from the tension between traditional dancheong color fields (jewel tones, earthy reds, forest greens) and sleek modern Korean graphic design. ' +
      'Strong typographic hierarchy, structured grids with occasional expressive breaks.',
  },
  {
    id: 'thai',
    label: 'Thai',
    directive:
      'Thai visual richness: warm, jewel-toned, layered. ' +
      'Inspiration from gilded temple motifs, silk textile geometry, and tropical botanical illustration. ' +
      'Ornate borders and pattern details are welcome at the edges while the item listing stays legible and clean.',
  },
  {
    id: 'vietnamese',
    label: 'Vietnamese',
    directive:
      'Vietnamese visual character: fresh and refined, inflected by French colonial elegance and Southeast Asian warmth. ' +
      'Think clean typography on lightly textured grounds, botanical motifs, airy spacing, and a palette that balances jade greens, warm neutrals, and occasional vermilion accents.',
  },
  {
    id: 'indian',
    label: 'Indian',
    hint: 'North, South, Goan…',
    directive:
      'Indian visual heritage: rich, layered, and celebratory. ' +
      'Draw from block-print textile patterns, spice-market warmth (saffron, turmeric, deep magenta, terracotta), and intricate geometric borders. ' +
      'Opulent detail should be balanced by clear typographic hierarchy so the menu stays readable.',
  },
  {
    id: 'mexican',
    label: 'Mexican',
    hint: 'Oaxacan, Yucatecan…',
    directive:
      'Mexican visual vitality: vibrant, handcrafted, and deeply rooted. ' +
      'Draw from Talavera tile patterns, Otomi embroidery geometry, folk-art illustration, and bold regional color traditions. ' +
      'Typography can be expressive — condensed display type, hand-lettered accents — balanced with an organized listing structure.',
  },
  {
    id: 'peruvian',
    label: 'Peruvian',
    directive:
      'Peruvian visual identity: earthy Andean warmth meets contemporary Lima sophistication. ' +
      'Textile geometry (woven stripe and diamond patterns), terracotta and deep indigo tones, and the quiet confidence of modern Peruvian design. ' +
      'Can range from rustic handcrafted to sleek cevichería-modern depending on restaurant register.',
  },
  {
    id: 'brazilian',
    label: 'Brazilian',
    directive:
      'Brazilian visual energy: tropical, exuberant, and warm-blooded. ' +
      'Bold color contrasts, lush botanical motifs, and an optimistic graphic sensibility. ' +
      'Can reference modernist Brazilian architecture (clean geometry, expressive color) or street-market vibrancy — let the restaurant type steer the register.',
  },
  {
    id: 'italian',
    label: 'Italian',
    hint: 'Neapolitan, Roman, Tuscan…',
    directive:
      'Italian visual tradition: warm, timeless, and craft-proud. ' +
      'Draw from Roman stone, Tuscan linen, aged parchment, and the quiet luxury of Italian typographic heritage. ' +
      'Earthy, warm palettes — cream, ochre, sienna, olive — ground the design. ' +
      'Classical serif display type and restrained ornament convey quality without pretension.',
  },
  {
    id: 'french',
    label: 'French',
    hint: 'Bistro, haute cuisine…',
    directive:
      'French visual refinement: from the informal warmth of a bistro to the precise luxury of haute cuisine. ' +
      'Classic French typographic conventions: small caps, thin rules, centered title blocks, careful leading. ' +
      'Palette ranges from bistro chalkboard warmth (cream, deep red, ochre) to the cool restraint of Michelin-level minimalism.',
  },
  {
    id: 'spanish',
    label: 'Spanish',
    hint: 'Basque, Andalusian…',
    directive:
      'Spanish visual character: passionate, sun-drenched, regionally proud. ' +
      'Andalusian Azulejo tile geometry, Basque modernist boldness, or Catalan Art Nouveau flourish depending on the region. ' +
      'Rich ochres, deep reds, and terracottas are natural anchors; typography can be expressive and confident.',
  },
  {
    id: 'greek',
    label: 'Greek',
    directive:
      'Greek visual heritage: Mediterranean clarity and ancient elegance. ' +
      'Clean white or limestone grounds, deep cobalt and terracotta accents, key-pattern borders used sparingly, and classical serif typography. ' +
      'The overall feel should be airy and sun-washed, not tourist-kitsch.',
  },
  {
    id: 'mediterranean',
    label: 'Mediterranean',
    directive:
      'Mediterranean visual warmth: coastal, sun-drenched, and effortlessly relaxed. ' +
      'Sea-glass blues, warm terracotta, aged linen, and olive tones. ' +
      'Airy layouts, hand-drawn botanical or citrus motifs used lightly, and clean serif or humanist sans typography.',
  },
  {
    id: 'middle-eastern',
    label: 'Middle Eastern',
    directive:
      'Middle Eastern visual richness: geometric pattern, calligraphic flow, and deep jewel tones. ' +
      'Arabesque tile geometry, saffron and deep teal, aged brass and copper warmth. ' +
      'Arabic script or calligraphic display lettering adds authenticity; intricate border ornament can frame sections without cluttering the listing.',
  },
  {
    id: 'american',
    label: 'American',
    directive:
      'American visual confidence: direct, bold, and unpretentious. ' +
      'Ranges from diner-era nostalgia (slab serif, cream and red) to New American refinement (clean sans, restrained palette) — let the restaurant type and vibe steer the specific direction. ' +
      'Strong typographic hierarchy and generous spacing always apply.',
  },
  {
    id: 'southern-bbq',
    label: 'Southern BBQ',
    directive:
      'Southern BBQ visual soul: handmade, smoke-worn, and deeply American. ' +
      'Distressed woodgrain or kraft-paper texture, hand-stamped or woodblock-print display type, bold condensed headers, smoke and ember color tones. ' +
      'Feels printed by hand, not designed on a screen.',
  },
  {
    id: 'seafood',
    label: 'Seafood',
    directive:
      'Seafood visual freshness: coastal, breezy, and honest. ' +
      'Nautical restraint — weathered navy and rope-tan, or bright coastal white and sea-glass. ' +
      'Occasional nautical motifs (rope dividers, compass roses, fish line-drawings) welcome when used sparingly. ' +
      "Typography is clean and legible, feeling like a harbor-side chalkboard or a fisherman's market card.",
  },
  {
    id: 'steakhouse',
    label: 'Steakhouse',
    directive:
      'Steakhouse visual weight: masculine, substantial, and confident. ' +
      'Deep leather browns, polished brass, aged wood, and near-black grounds. ' +
      'Heavy serif or slab-serif display type, bold section headers, ample weight in all typographic choices. ' +
      'The design should feel solid and assured — like the menu itself has substance.',
  },
]

export const RESTAURANT_TYPE_PRESETS: Preset[] = [
  {
    id: 'fine-dining',
    label: 'Fine dining',
    hint: 'Sparse, generous whitespace',
    directive:
      'Sparse composition with 60%+ whitespace. Single-column item list or narrow two-column. ' +
      'Section headers in small caps with extra letter-spacing. Prices right-aligned, sometimes joined to dish names by a thin leader line of dots. Short dish names, restrained descriptions.',
  },
  {
    id: 'casual-dining',
    label: 'Casual dining',
    directive:
      'Comfortable two-column grid with moderate whitespace. Friendly section banners. Prices inline or right-aligned. Balanced text + subtle illustration accents.',
  },
  {
    id: 'fast-casual',
    label: 'Fast casual',
    directive:
      'Bright, confident layout with clear visual hierarchy. Two or three columns, bold sans-serif section headers, modular blocks for categories. Easy to skim.',
  },
  {
    id: 'fast-food',
    label: 'Fast food',
    hint: 'High-density scannable grid',
    directive:
      'High-density scannable grid. Heavy sans-serif display type for category banners. Prices large and prominent next to dish names. Color-blocked sections, poster-like energy.',
  },
  {
    id: 'cafe-bistro',
    label: 'Café / Bistro',
    directive:
      'Chalkboard / handwritten cafe feel OR casual French bistro framing. Two modest columns, rustic serif or condensed sans-serif, small hand-drawn flourishes at section breaks.',
  },
  {
    id: 'brasserie',
    label: 'Brasserie',
    directive:
      'Classic Parisian brasserie frame: thin double-rule borders, centered title block, compact two-column listing, slab-serif or slab-style caps for section headers.',
  },
  {
    id: 'izakaya',
    label: 'Izakaya',
    directive:
      'Japanese izakaya energy: vertical or mixed-orientation type where appropriate, bold brush-stroke or stencil display accents, ink-on-kraft or ink-on-cream feel, tightly packed sections.',
  },
  {
    id: 'tapas-bar',
    label: 'Tapas bar',
    directive:
      'Short, small-plates listing with tight vertical rhythm. Two or three narrow columns, price tags tucked beside each dish, warm hand-lettering or modern-rustic serif.',
  },
  {
    id: 'food-truck',
    label: 'Food truck',
    directive:
      'Poster-scale display type, stencil or slab serif, price tags as circles or ribbons, graphic color blocks, signage energy.',
  },
  {
    id: 'pop-up',
    label: 'Pop-up',
    directive:
      'Editorial zine feel. Asymmetric layout, a single hero section and a focused short list, expressive display type paired with mono body text.',
  },
  {
    id: 'hotel-restaurant',
    label: 'Hotel restaurant',
    directive:
      'Quietly refined, corporate-luxury restraint. Centered compositions, classic serif display, thin gold or foil-like accent rules, generous gutters.',
  },
  {
    id: 'private-club',
    label: 'Private club',
    directive:
      'Discreet members-only feel. Deeply set margins, engraved-style display type, small caps everywhere, monogram or crest motif at the header.',
  },
]

export const VIBE_PRESETS: Preset[] = [
  {
    id: 'luxury',
    label: 'Luxury / White-tablecloth',
    directive:
      'Didone / modern serif display type (Bodoni-like), high-contrast thin/thick strokes, generous letter-spacing, deep black ink on off-white or ivory, slim gold rule accents, no decorative flourishes. Museum-catalog restraint.',
  },
  {
    id: 'rustic',
    label: 'Rustic / Farmhouse',
    directive:
      'Warm kraft / parchment background texture (subtle, not overpowering). Slab serif or humanist serif body, hand-lettered display accents, botanical line-drawing flourishes, muted terracotta / sage / cream palette.',
  },
  {
    id: 'authentic',
    label: 'Authentic / Traditional',
    directive:
      'Heritage motifs rooted in the cuisine (traditional tile patterns, calligraphic flourishes, regional decorative borders). Classic serif display, cream or parchment ground, deep regional color accents.',
  },
  {
    id: 'hipster',
    label: 'Hipster / Independent',
    directive:
      'Editorial indie magazine energy. Mixed type: wide grotesque display + mono body, or a Recoleta-style display paired with Inter. Off-center layouts, oversized section numbers, small grid markers. Paper or riso-print texture.',
  },
  {
    id: 'minimalist',
    label: 'Minimalist / Zen',
    directive:
      'Extreme restraint. Single type family in 2–3 weights, huge whitespace, a single hairline rule separating sections, near-monochrome palette (warm white, ink gray, one muted accent). Japanese design sensibility.',
  },
  {
    id: 'dark-moody',
    label: 'Dark & Moody',
    directive:
      'Deep near-black background with warm amber / gold / bone accents. High-contrast serif display, hand-illustrated spot accents (a wine glass, a leaf), tight leading, cinematic ink feel.',
  },
  {
    id: 'bright-playful',
    label: 'Bright & Playful',
    directive:
      'Confectionery palette — sky, coral, butter-yellow. Rounded geometric sans display, playful squiggle dividers, bouncy headline layouts. Never cluttered — air between elements.',
  },
  {
    id: 'industrial',
    label: 'Industrial / Urban',
    directive:
      'Concrete / raw-paper ground, stencil or condensed grotesque display, mono body, heavy rules, grid-index markers ("01 / 02") next to section headers, brutalist calm.',
  },
  {
    id: 'coastal',
    label: 'Coastal / Breezy',
    directive:
      'Washed linen / driftwood palette (pale blue, sand, bone). Airy serif display, relaxed two-column layout, small seashell or wave spot accents used sparingly.',
  },
  {
    id: 'retro',
    label: 'Retro / Nostalgic',
    directive:
      'Mid-century or diner heritage — chunky slab-serif or script display, cream + deep-red + mustard palette, laurel wreath or sunburst accents, halftone-print texture.',
  },
  {
    id: 'romantic',
    label: 'Romantic',
    directive:
      'Candlelit atmosphere in flat graphic form: cream or blush ground, script-style display paired with classic serif body, hand-drawn florals framing the title, deep burgundy or forest accents.',
  },
  {
    id: 'family-friendly',
    label: 'Family-friendly',
    directive:
      'Warm, inviting, uncluttered. Friendly rounded sans-serif, sunny palette, simple dish illustrations between sections, generous line-height so it reads easily across ages.',
  },
]

export const PALETTE_PRESETS: Preset[] = [
  {
    id: 'warm-earthy',
    label: 'Warm & Earthy',
    directive:
      'Palette direction — warm and earthy: parchment or warm cream ground, deep espresso-brown or charred-wood type, terracotta and ochre accents. ' +
      'Every tone should feel sun-baked and handmade. Cool blues and grays do not belong here.',
  },
  {
    id: 'cool-minimal',
    label: 'Cool & Minimal',
    directive:
      'Palette direction — cool and minimal: a cool off-white or bone ground, graphite or cool-black type, one restrained accent in pale blue, sage, or dusty slate. ' +
      'Near-monochrome — the design earns its interest through typography and spacing, not color.',
  },
  {
    id: 'bold-graphic',
    label: 'Bold & Graphic',
    directive:
      'Palette direction — bold and graphic: two strongly saturated field colors plus black or white type. ' +
      'Poster energy — one color dominates the background or a large section band, the second appears in price tags, rules, and accents. High visual impact, no muddy in-betweens.',
  },
  {
    id: 'dark-moody',
    label: 'Dark & Moody',
    directive:
      'Palette direction — dark and moody: a deep, near-black or very dark ground (let the cuisine and vibe guide the exact dark tone — charcoal, forest, navy, or dark burgundy are all valid). ' +
      'Ivory or bone type for warmth, gold or amber accent for a touch of candlelight. Cinematic depth.',
  },
  {
    id: 'pastel-soft',
    label: 'Pastel & Soft',
    directive:
      'Palette direction — pastel and soft: blush, butter, or pale lavender ground; muted plum, sage, or dusty rose type; one gentle pastel accent. ' +
      "Low contrast, high warmth — the palette feels like morning light, not a children's menu.",
  },
  {
    id: 'high-contrast',
    label: 'High Contrast / B&W',
    directive:
      'Palette direction — high contrast: pure white ground, pure black type, zero decorative color. ' +
      'A single thin accent rule in warm gold or graphite is the only concession. ' +
      'Uncompromising — the design earns all of its impact from typography and structure alone.',
  },
]

export const COPY_TONE_PRESETS: Preset[] = [
  {
    id: 'precise-clinical',
    label: 'Precise & Clinical',
    hint: '“12oz dry-aged ribeye, 28-day hang”',
    directive:
      'Copy voice — precise & clinical: short, spec-driven descriptions. Cuts, weights, hang times, provenance. No poetry.',
  },
  {
    id: 'poetic-evocative',
    label: 'Poetic & Evocative',
    hint: '“slow-kissed short rib, ember-roasted root”',
    directive:
      'Copy voice — poetic & evocative: sensory verbs ("slow-braised", "charred", "whisper of"), ingredient-as-image phrasing, lowercase where appropriate.',
  },
  {
    id: 'warm-friendly',
    label: 'Warm & Friendly',
    hint: '“our take on a classic — you’ll love it”',
    directive:
      'Copy voice — warm & friendly: first-person plural ("our take on…"), reassuring, conversational, never stiff.',
  },
  {
    id: 'playful-casual',
    label: 'Playful & Casual',
    hint: '“the best burger we’ve ever made, no notes”',
    directive:
      'Copy voice — playful & casual: cheeky, short asides, the occasional em-dash joke. Confident without being clinical.',
  },
  {
    id: 'luxurious-formal',
    label: 'Luxurious & Formal',
    hint: '“a delicate composition of…”',
    directive:
      'Copy voice — luxurious & formal: composed, third-person, measured cadence, restrained adjectives, no exclamation.',
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
