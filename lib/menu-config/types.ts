/**
 * Menu generation configuration.
 *
 * Every categorical field accepts either a preset id OR a free-text custom
 * string — we can't anticipate every cuisine, vibe, or concept, so the UI
 * must always expose a "write your own" fallback that feeds the prompt.
 */

export type MenuFormat = 'a4' // '1x1' | '4:5' coming later

export interface CuisineSelection {
  /** Preset id from CUISINE_PRESETS, or free-text if `custom` is true. */
  value: string
  custom: boolean
  /** Optional regional style, e.g. "Sichuan", "Oaxacan", "Neapolitan". */
  regional?: string
}

export type ContentDensity = 'text-only' | 'text-accents' | 'text-imagery'

export type PriceDisplay = 'symbol' | 'numeric' | 'hidden'

export interface LanguageConfig {
  /** Primary language code, e.g. 'en', 'es', 'ja', 'ar'. */
  primary: string
  /** Optional secondary for bilingual menus. */
  secondary?: string
}

export interface MenuStructureConfig {
  sections: string[]
  prixFixe: boolean
  tastingMenu: boolean
  pairingSuggestions: boolean
  chefsNotes: boolean
  dietaryIcons: boolean
}

/**
 * Free-text-capable field: either a preset id from the matching preset list,
 * or a user-typed custom string.
 */
export interface SelectableValue {
  value: string
  custom: boolean
}

export interface MenuConfig {
  /* Identity */
  restaurantName: string

  /* Concept — cuisine is multi-select to support fusion. */
  cuisines: CuisineSelection[]

  /**
   * Restaurant type × vibe is a 2-axis matrix — both values combine to
   * drive layout density, tone, and palette in the prompt.
   */
  restaurantType: SelectableValue | null
  vibe: SelectableValue | null

  /* Voice */
  contentDensity: ContentDensity
  palette: SelectableValue | null
  copyTone: SelectableValue | null

  /* Structure */
  structure: MenuStructureConfig
  priceDisplay: PriceDisplay

  /* Localization */
  language: LanguageConfig

  /* Output */
  format: MenuFormat
}

export const DEFAULT_MENU_CONFIG: MenuConfig = {
  restaurantName: '',
  cuisines: [],
  restaurantType: null,
  vibe: null,
  contentDensity: 'text-accents',
  palette: null,
  copyTone: null,
  structure: {
    sections: ['Appetizers', 'Mains', 'Desserts', 'Drinks'],
    prixFixe: false,
    tastingMenu: false,
    pairingSuggestions: false,
    chefsNotes: false,
    dietaryIcons: true,
  },
  priceDisplay: 'symbol',
  language: { primary: 'en' },
  format: 'a4',
}
