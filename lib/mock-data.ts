/**
 * Mock data for MVP. Every "AI processing" and CRUD call in the UI reads from
 * here so the frontend feels alive without a backend. Swap these out per
 * feature as real APIs come online.
 */

export type DietaryTag = 'V' | 'VG' | 'GF' | 'DF' | 'NF'

export interface MenuItem {
  id: string
  name: string
  category: string
  price: number
  description: string
  tags: DietaryTag[]
  views?: number
  trend?: number // percent change
  featured?: boolean
}

export interface Menu {
  id: string
  name: string
  updatedAt: string // ISO
  itemCount: number
  style: string
  status: 'active' | 'print-ready' | 'draft'
  qrEnabled: boolean
  colorScheme: 'dark' | 'cream' | 'white' | 'photo'
}

export interface QrLocation {
  id: string
  name: string
  scans: number
  status: 'active' | 'paused'
  slug: string
}

export interface SocialPost {
  id: string
  platform: 'instagram' | 'story'
  caption: string
  hashtags: string[]
  gradient: string
  title: string
}

/* ------------------------------------------------------------------------- */
/* Osteria Verde 34-item sample dataset (PRD §5.4)                            */
/* ------------------------------------------------------------------------- */

export const SAMPLE_CATEGORIES = [
  'All',
  'Starters',
  'Pasta',
  'Mains',
  'Desserts',
  'Drinks',
] as const
export type CategoryFilter = (typeof SAMPLE_CATEGORIES)[number]

export const SAMPLE_MENU_ITEMS: MenuItem[] = [
  {
    id: 'i1',
    name: 'Burrata di Puglia',
    category: 'Starters',
    price: 16,
    description: 'Creamy Puglian burrata, heirloom tomato, basil oil.',
    tags: ['V', 'GF'],
    views: 412,
    trend: 12,
  },
  {
    id: 'i2',
    name: 'Carpaccio di Manzo',
    category: 'Starters',
    price: 18,
    description: 'Thinly sliced beef, shaved parmigiano, rocket, lemon.',
    tags: ['GF'],
    views: 276,
    trend: -4,
  },
  {
    id: 'i3',
    name: 'Vitello Tonnato',
    category: 'Starters',
    price: 19,
    description: 'Chilled veal, tuna-caper sauce, fried capers.',
    tags: [],
    views: 184,
    trend: 3,
  },
  {
    id: 'i4',
    name: 'Tagliatelle al Tartufo',
    category: 'Pasta',
    price: 32,
    description: 'Hand-rolled egg pasta, Alba white truffle, aged parmigiano.',
    tags: [],
    views: 1284,
    trend: 34,
    featured: true,
  },
  {
    id: 'i5',
    name: 'Risotto ai Porcini',
    category: 'Pasta',
    price: 28,
    description: 'Carnaroli rice, porcini mushrooms, parmigiano, parsley.',
    tags: ['V', 'GF'],
    views: 692,
    trend: 18,
  },
  {
    id: 'i6',
    name: 'Spaghetti alle Vongole',
    category: 'Pasta',
    price: 26,
    description: 'House spaghetti, manila clams, white wine, garlic, chili.',
    tags: ['DF'],
    views: 512,
    trend: 8,
  },
  {
    id: 'i7',
    name: 'Pappardelle al Cinghiale',
    category: 'Pasta',
    price: 28,
    description: 'Wide pasta ribbons, slow-braised wild boar ragù.',
    tags: [],
    views: 388,
    trend: -2,
  },
  {
    id: 'i8',
    name: 'Branzino alla Brace',
    category: 'Mains',
    price: 38,
    description: 'Whole grilled Mediterranean sea bass, salsa verde.',
    tags: ['GF', 'DF'],
    views: 612,
    trend: 22,
  },
  {
    id: 'i9',
    name: 'Bistecca alla Fiorentina',
    category: 'Mains',
    price: 62,
    description: 'Dry-aged T-bone, rosemary, Tuscan oil (for 2).',
    tags: ['GF', 'DF'],
    views: 804,
    trend: 15,
    featured: true,
  },
  {
    id: 'i10',
    name: 'Ossobuco alla Milanese',
    category: 'Mains',
    price: 36,
    description: 'Braised veal shank, saffron risotto, gremolata.',
    tags: ['GF'],
    views: 342,
    trend: 5,
  },
  {
    id: 'i11',
    name: 'Tiramisù della Casa',
    category: 'Desserts',
    price: 12,
    description: 'Espresso-soaked savoiardi, mascarpone, cocoa.',
    tags: ['V'],
    views: 928,
    trend: 11,
  },
  {
    id: 'i12',
    name: 'Panna Cotta ai Frutti di Bosco',
    category: 'Desserts',
    price: 11,
    description: 'Silky vanilla cream, wild-berry compote.',
    tags: ['V', 'GF'],
    views: 412,
    trend: 9,
  },
]

/* ------------------------------------------------------------------------- */
/* Menus                                                                      */
/* ------------------------------------------------------------------------- */

export const SAMPLE_MENUS: Menu[] = [
  {
    id: 'm1',
    name: 'Spring Tasting Dinner',
    updatedAt: '2026-04-12T18:20:00Z',
    itemCount: 34,
    style: 'Bold & Dramatic',
    status: 'active',
    qrEnabled: true,
    colorScheme: 'dark',
  },
  {
    id: 'm2',
    name: 'Weekday Lunch Specials',
    updatedAt: '2026-04-08T12:05:00Z',
    itemCount: 12,
    style: 'Minimal Elegance',
    status: 'print-ready',
    qrEnabled: false,
    colorScheme: 'white',
  },
  {
    id: 'm3',
    name: 'Sommelier Wine List',
    updatedAt: '2026-03-29T14:30:00Z',
    itemCount: 48,
    style: 'Classic Vintage',
    status: 'draft',
    qrEnabled: false,
    colorScheme: 'cream',
  },
]

/* ------------------------------------------------------------------------- */
/* QR / Scan analytics                                                        */
/* ------------------------------------------------------------------------- */

export const SAMPLE_QR_LOCATIONS: QrLocation[] = [
  { id: 'q1', name: 'Main dining room', scans: 1284, status: 'active', slug: 'osteria-verde' },
  { id: 'q2', name: 'Terrace', scans: 612, status: 'active', slug: 'osteria-verde-terrace' },
  { id: 'q3', name: 'Private events', scans: 184, status: 'paused', slug: 'osteria-verde-events' },
]

export const SAMPLE_QR_STATS = {
  peakHour: '8:30 PM',
  avgSession: '2m 14s',
  topItem: 'Tagliatelle al Tartufo',
  uniqueVisitors: 942,
  last7Days: [120, 148, 132, 168, 201, 242, 213], // Mon → Sun
}

/* ------------------------------------------------------------------------- */
/* Social posts                                                               */
/* ------------------------------------------------------------------------- */

export const SAMPLE_SOCIAL_POSTS: SocialPost[] = [
  {
    id: 's1',
    platform: 'instagram',
    title: 'Tagliatelle al Tartufo',
    caption: 'White truffle season is here. Only at Osteria Verde, until May 10.',
    hashtags: ['#truffle', '#osteriaverde', '#florenceeats'],
    gradient: 'linear-gradient(135deg, #1c3829, #3d7059)',
  },
  {
    id: 's2',
    platform: 'instagram',
    title: 'Spring tasting menu',
    caption: 'Seven courses. Thirty ingredients. One afternoon in Tuscany.',
    hashtags: ['#tastingmenu', '#spring2026'],
    gradient: 'linear-gradient(135deg, #c9922a, #7a4f08)',
  },
  {
    id: 's3',
    platform: 'story',
    title: "Tonight's special",
    caption: 'Ossobuco alla Milanese, hand-made saffron risotto.',
    hashtags: ['#specials'],
    gradient: 'linear-gradient(135deg, #faf8f3, #dee8e1)',
  },
  {
    id: 's4',
    platform: 'instagram',
    title: 'Meet our sommelier',
    caption: '40 bottles curated from Piedmont, Tuscany & Sicily.',
    hashtags: ['#wine', '#sommelier'],
    gradient: 'linear-gradient(135deg, #2a5240, #0d1f14)',
  },
]
