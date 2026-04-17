'use client'

import { useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'
import { WizardStep } from '@/components/wizard/WizardShell'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { FieldGroup } from './style/FieldGroup'
import { PresetPicker } from './style/PresetPicker'
import { CuisineMultiSelect } from './style/CuisineMultiSelect'
import { SectionsEditor } from './style/SectionsEditor'
import { PromptPreview } from './style/PromptPreview'
import {
  CONTENT_DENSITY_PRESETS,
  COPY_TONE_PRESETS,
  LANGUAGE_PRESETS,
  MENU_FORMAT_PRESETS,
  PALETTE_PRESETS,
  PRICE_DISPLAY_PRESETS,
  RESTAURANT_TYPE_PRESETS,
  RTL_LANGUAGES,
  VIBE_PRESETS,
} from '@/lib/menu-config/presets'
import type {
  ContentDensity,
  MenuConfig,
  PriceDisplay,
  SelectableValue,
} from '@/lib/menu-config/types'
import type { WizardState } from '../useWizard'

interface Props {
  state: WizardState
  dispatch: React.Dispatch<any>
}

export function Step2Style({ state, dispatch }: Props) {
  const t = useTranslations('Wizard.style')
  const { config } = state

  function patch(p: Partial<MenuConfig>) {
    dispatch({ type: 'set-config', patch: p })
  }
  function setSelectable(
    key: 'restaurantType' | 'vibe' | 'palette' | 'copyTone',
    v: SelectableValue | null,
  ) {
    patch({ [key]: v } as Partial<MenuConfig>)
  }

  const densityWarn = config.contentDensity === 'text-imagery'
  const secondaryLang = config.language.secondary
  const rtlActive =
    RTL_LANGUAGES.has(config.language.primary) ||
    (!!secondaryLang && RTL_LANGUAGES.has(secondaryLang))

  return (
    <WizardStep stepKey="style" title={t('title')} description={t('description')}>
      <div className="space-y-10">
        {/* ───── Concept ───── */}
        <div className="space-y-6">
          <h2 className="font-display text-text border-brand-border border-b pb-2 text-lg font-semibold">
            Concept
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="restaurant-name">
                Restaurant name <span className="text-pill-red-fg">*</span>
              </Label>
              <Input
                id="restaurant-name"
                placeholder="Osteria Verde"
                value={config.restaurantName}
                onChange={(e) => patch({ restaurantName: e.target.value })}
              />
            </div>
          </div>

          <FieldGroup
            title="Cuisine"
            description="Multi-select for fusion concepts. Add a regional style or type your own if it's not listed."
            required
          >
            <CuisineMultiSelect
              value={config.cuisines}
              onChange={(cuisines) => patch({ cuisines })}
            />
          </FieldGroup>

          <div className="bg-cream/60 border-brand-border rounded-xl border p-5">
            <p className="text-text2 mb-4 text-xs">
              Restaurant type and vibe work together as a 2-axis matrix — e.g. “fast casual +
              luxury” is a real combination. Both values shape layout density, palette, and tone.
            </p>
            <div className="grid gap-6 lg:grid-cols-2">
              <FieldGroup
                title="Restaurant type"
                description="Drives layout density (fine dining = sparse; fast food = high-density grid)."
                required
              >
                <PresetPicker
                  presets={RESTAURANT_TYPE_PRESETS}
                  value={config.restaurantType}
                  onChange={(v) => setSelectable('restaurantType', v)}
                  showHints
                  placeholder="e.g. omakase counter, supper club…"
                  ariaLabel="Restaurant type"
                />
              </FieldGroup>
              <FieldGroup
                title="Vibe"
                description="Affects font pairing, color palette, and copy tone."
                required
              >
                <PresetPicker
                  presets={VIBE_PRESETS}
                  value={config.vibe}
                  onChange={(v) => setSelectable('vibe', v)}
                  placeholder="e.g. Tokyo convenience store, old NY deli…"
                  ariaLabel="Vibe"
                />
              </FieldGroup>
            </div>
          </div>
        </div>

        {/* ───── Voice ───── */}
        <div className="space-y-6">
          <h2 className="font-display text-text border-brand-border border-b pb-2 text-lg font-semibold">
            Voice
          </h2>

          <FieldGroup title="Content density">
            <div className="flex flex-wrap gap-2">
              {CONTENT_DENSITY_PRESETS.map((p) => {
                const active = config.contentDensity === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => patch({ contentDensity: p.id as ContentDensity })}
                    className={`border-brand-border bg-card text-text2 flex flex-col items-start rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      active ? 'border-g800 bg-g800/5 text-text ring-g800/30 ring-2' : ''
                    }`}
                  >
                    <span className="font-medium">{p.label}</span>
                    {p.hint && (
                      <span className="text-text2 mt-0.5 text-xs opacity-80">{p.hint}</span>
                    )}
                  </button>
                )
              })}
            </div>
            {densityWarn && (
              <div className="bg-amber-l border-amber/30 text-text mt-3 flex items-start gap-2 rounded-lg border p-3 text-xs">
                <AlertCircle className="mt-0.5 size-4 flex-shrink-0" />
                <span>
                  Image-heavy layouts work best with real food photography. Without uploaded photos,
                  AI imagery may look inconsistent — consider “text + small decorative accents”
                  instead.
                </span>
              </div>
            )}
          </FieldGroup>

          <FieldGroup title="Color palette mood" required>
            <PresetPicker
              presets={PALETTE_PRESETS}
              value={config.palette}
              onChange={(v) => setSelectable('palette', v)}
              placeholder="e.g. forest greens and aged brass, deep navy and burnt orange…"
              ariaLabel="Color palette mood"
            />
          </FieldGroup>

          <FieldGroup title="Copy tone" required>
            <PresetPicker
              presets={COPY_TONE_PRESETS}
              value={config.copyTone}
              onChange={(v) => setSelectable('copyTone', v)}
              showHints
              placeholder="Describe your brand voice…"
              ariaLabel="Copy tone"
            />
          </FieldGroup>
        </div>

        {/* ───── Structure ───── */}
        <div className="space-y-6">
          <h2 className="font-display text-text border-brand-border border-b pb-2 text-lg font-semibold">
            Structure
          </h2>

          <FieldGroup title="Sections" description="What appears on the menu and in what order.">
            <SectionsEditor
              value={config.structure.sections}
              onChange={(sections) => patch({ structure: { ...config.structure, sections } })}
            />
          </FieldGroup>

          <FieldGroup title="Blocks & extras">
            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleRow
                label="Prix fixe block"
                checked={config.structure.prixFixe}
                onChange={(v) => patch({ structure: { ...config.structure, prixFixe: v } })}
              />
              <ToggleRow
                label="Tasting menu block"
                checked={config.structure.tastingMenu}
                onChange={(v) => patch({ structure: { ...config.structure, tastingMenu: v } })}
              />
              <ToggleRow
                label="Drink pairing suggestions"
                checked={config.structure.pairingSuggestions}
                onChange={(v) =>
                  patch({ structure: { ...config.structure, pairingSuggestions: v } })
                }
              />
              <ToggleRow
                label="Chef's notes section"
                checked={config.structure.chefsNotes}
                onChange={(v) => patch({ structure: { ...config.structure, chefsNotes: v } })}
              />
              <ToggleRow
                label="Dietary icons (vegan, GF, spicy…)"
                checked={config.structure.dietaryIcons}
                onChange={(v) => patch({ structure: { ...config.structure, dietaryIcons: v } })}
              />
            </div>
          </FieldGroup>

          <FieldGroup title="Price display">
            <div className="flex flex-wrap gap-2">
              {PRICE_DISPLAY_PRESETS.map((p) => {
                const active = config.priceDisplay === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => patch({ priceDisplay: p.id as PriceDisplay })}
                    className={`border-brand-border bg-card text-text2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      active ? 'border-g800 bg-g800/5 text-text ring-g800/30 ring-2' : ''
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </FieldGroup>

          {config.priceDisplay !== 'hidden' && (
            <FieldGroup
              title="Currency symbol"
              description="Leave blank to show numbers only. Type any symbol or code."
            >
              <div className="flex flex-wrap items-center gap-2">
                {['$', '€', '£', '¥', 'AED', 'AED ', 'kr', 'CHF', 'R$'].map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    aria-pressed={config.currencySymbol === sym}
                    onClick={() => patch({ currencySymbol: sym })}
                    className={`border-brand-border bg-card text-text2 rounded-lg border px-3 py-2 font-mono text-sm transition-colors ${
                      config.currencySymbol === sym
                        ? 'border-g800 bg-g800/5 text-text ring-g800/30 ring-2'
                        : ''
                    }`}
                  >
                    {sym.trim()}
                  </button>
                ))}
                <Input
                  className="w-28"
                  placeholder="e.g. د.إ"
                  value={config.currencySymbol}
                  onChange={(e) => patch({ currencySymbol: e.target.value })}
                  aria-label="Custom currency symbol"
                />
              </div>
            </FieldGroup>
          )}
        </div>

        {/* ───── Localization ───── */}
        <div className="space-y-6">
          <h2 className="font-display text-text border-brand-border border-b pb-2 text-lg font-semibold">
            Language
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lang-primary">Primary language</Label>
              <Select
                value={config.language.primary}
                onValueChange={(v) => patch({ language: { ...config.language, primary: v } })}
              >
                <SelectTrigger id="lang-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_PRESETS.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lang-secondary">Secondary (optional, for bilingual)</Label>
              <Select
                value={secondaryLang ?? 'none'}
                onValueChange={(v) =>
                  patch({
                    language: {
                      ...config.language,
                      secondary: v === 'none' ? undefined : v,
                    },
                  })
                }
              >
                <SelectTrigger id="lang-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (monolingual)</SelectItem>
                  {LANGUAGE_PRESETS.filter((l) => l.id !== config.language.primary).map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {rtlActive && (
            <div className="bg-cream border-brand-border text-text2 rounded-lg border p-3 text-xs">
              RTL layout will be applied — the AI will adjust column order and alignment
              automatically.
            </div>
          )}
        </div>

        {/* ───── Format ───── */}
        <div className="space-y-6">
          <h2 className="font-display text-text border-brand-border border-b pb-2 text-lg font-semibold">
            Format
          </h2>
          <FieldGroup title="Output size" description="More formats (1:1, 4:5) coming soon.">
            <div className="flex flex-wrap gap-2">
              {MENU_FORMAT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={config.format === p.id}
                  className="border-g800 bg-g800/5 text-text ring-g800/30 rounded-lg border px-3 py-2 text-sm ring-2"
                  onClick={() => patch({ format: 'a4' })}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </FieldGroup>
        </div>

        <PromptPreview config={config} items={state.items} />
      </div>
    </WizardStep>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="border-brand-border bg-card hover:bg-g800/5 flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
      <span className="text-text">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}
