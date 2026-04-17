import { QrCode, Sparkles } from 'lucide-react'

const PREVIEW_ITEMS = [
  { name: 'Burrata di Puglia', price: '16', tag: 'V' },
  { name: 'Tagliatelle al Tartufo', price: '32', tag: '⭐' },
  { name: 'Branzino alla Brace', price: '38', tag: 'GF' },
  { name: 'Risotto ai Porcini', price: '28', tag: 'V' },
  { name: 'Tiramisù della Casa', price: '12', tag: 'V' },
] as const

export function MenuPreviewCard() {
  return (
    <div
      role="img"
      aria-label="Example menu designed by MenuAI — hover to see the AI-generated version"
      className="group border-brand-border relative overflow-hidden rounded-2xl border bg-white shadow-xl shadow-black/5"
    >
      {/* Default state: stylised text menu */}
      <div className="transition-opacity duration-500 group-hover:opacity-0">
        <div className="bg-g800 px-8 py-10 text-center">
          <p className="text-g200 font-display text-xs tracking-[0.3em] uppercase">Osteria Verde</p>
          <h3 className="font-display mt-2 text-3xl font-bold text-white italic">Spring Tasting</h3>
          <div className="bg-amber mx-auto mt-4 h-[2px] w-12" />
          <p className="text-g200 mt-4 text-xs">April 2026 · Firenze</p>
        </div>

        <div className="divide-brand-border divide-y px-8 py-6">
          {PREVIEW_ITEMS.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-display text-text text-sm font-semibold">{item.name}</span>
                <span className="text-text3 text-[10px] font-medium">{item.tag}</span>
              </div>
              <span className="text-text2 font-mono text-xs">€{item.price}</span>
            </div>
          ))}
        </div>

        <div className="bg-g50 flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-g800 flex h-7 w-7 items-center justify-center rounded-md">
              <QrCode className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-text text-[10px] font-semibold">Scan to view online</span>
              <span className="text-text3 font-mono text-[9px]">menuai.app/osteria-verde</span>
            </div>
          </div>
          <span className="text-text3 font-display text-[10px] italic">— since 2021 —</span>
        </div>
      </div>

      {/* Hover state: AI-generated menu image */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      >
        <img src="/showcase/hero-menu.png" alt="" className="h-full w-full object-cover" />
        {/* Gradient scrim so the label reads cleanly */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
          <Sparkles className="text-amber h-3.5 w-3.5" />
          <span className="font-display text-xs font-semibold tracking-wide text-white">
            AI-generated
          </span>
        </div>
      </div>
    </div>
  )
}
