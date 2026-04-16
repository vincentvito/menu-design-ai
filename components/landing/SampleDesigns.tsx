import { getTranslations } from 'next-intl/server'

interface SampleProps {
  id: string
  title: string
  subtitle: string
  scheme: 'dark' | 'cream' | 'white' | 'photo'
}

const samples: SampleProps[] = [
  { id: 'bold', title: 'Bold & Dramatic', subtitle: 'Black + amber · serif', scheme: 'dark' },
  { id: 'vintage', title: 'Classic Vintage', subtitle: 'Parchment · engraved', scheme: 'cream' },
  {
    id: 'minimal',
    title: 'Minimal Elegance',
    subtitle: 'Whitespace · serif italic',
    scheme: 'white',
  },
  { id: 'photo', title: 'Photo-Centric', subtitle: 'Split layout · modern', scheme: 'photo' },
]

function SampleCard({ sample }: { sample: SampleProps }) {
  if (sample.scheme === 'dark') {
    return (
      <div className="bg-g800 flex aspect-[3/4] flex-col p-6 text-white">
        <p className="text-amber font-display text-[10px] tracking-[0.4em] uppercase">La Carta</p>
        <div className="mt-auto">
          <div className="bg-amber mb-4 h-[2px] w-10" />
          <h4 className="font-display text-2xl leading-none font-bold italic">Primi Piatti</h4>
          <p className="text-g200 mt-3 text-[10px] leading-relaxed">
            Tagliatelle al tartufo — €32
            <br />
            Risotto ai porcini — €28
            <br />
            Spaghetti alle vongole — €26
          </p>
        </div>
      </div>
    )
  }

  if (sample.scheme === 'cream') {
    return (
      <div
        className="flex aspect-[3/4] flex-col p-6"
        style={{
          background:
            'repeating-linear-gradient(45deg, var(--color-cream), var(--color-cream) 10px, color-mix(in oklab, var(--color-amber-l) 65%, var(--color-cream)) 10px, color-mix(in oklab, var(--color-amber-l) 65%, var(--color-cream)) 11px)',
        }}
      >
        <p className="text-pill-amber-fg font-display text-center text-[10px] tracking-[0.4em]">
          ESTABLISHED 1902
        </p>
        <h4 className="font-display text-text mt-4 text-center text-lg leading-tight font-bold italic">
          Chef&rsquo;s Tasting Menu
        </h4>
        <div className="border-pill-amber-fg/40 my-4 border-t border-dashed" />
        <div className="text-text space-y-2 text-[10px]">
          <div className="flex justify-between">
            <span>Crudo di Ricciola</span>
            <span>22</span>
          </div>
          <div className="flex justify-between">
            <span>Pappardelle al Cinghiale</span>
            <span>28</span>
          </div>
          <div className="flex justify-between">
            <span>Bistecca alla Fiorentina</span>
            <span>62</span>
          </div>
        </div>
      </div>
    )
  }

  if (sample.scheme === 'white') {
    return (
      <div className="flex aspect-[3/4] flex-col bg-white p-6">
        <div className="bg-text h-[1px] w-6" />
        <p className="text-text3 mt-4 font-mono text-[10px] tracking-widest uppercase">
          Spring · ’26
        </p>
        <div className="mt-auto space-y-3">
          <h4 className="font-display text-text text-2xl leading-tight font-light italic">
            Dinner
            <br />à la carte
          </h4>
          <p className="text-text2 max-w-[9rem] text-[10px] leading-relaxed">
            Menu changes daily. Please inform your server of any allergies.
          </p>
        </div>
      </div>
    )
  }

  // photo
  return (
    <div className="relative flex aspect-[3/4] flex-col overflow-hidden bg-white">
      <div
        className="relative h-1/2"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in oklab, var(--color-amber) 80%, white), var(--color-amber) 40%, var(--color-pill-amber-fg))',
        }}
      >
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          <div
            className="h-full w-full"
            style={{ background: 'radial-gradient(circle at 70% 60%, #fff, transparent 50%)' }}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-amber font-mono text-[9px] tracking-widest uppercase">Signature</p>
        <h4 className="font-display text-text mt-2 text-lg leading-tight font-bold">
          Truffle Tagliatelle
        </h4>
        <p className="text-text2 mt-2 text-[10px] leading-relaxed">
          Hand-rolled egg pasta, Alba white truffle, aged parmigiano.
        </p>
        <span className="text-text mt-auto font-mono text-sm font-semibold">€32</span>
      </div>
    </div>
  )
}

export async function SampleDesigns() {
  const t = await getTranslations('Landing.samples')

  return (
    <section id="samples" className="bg-g50 relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-amber text-xs font-semibold tracking-[0.2em] uppercase">
            {t('label')}
          </p>
          <h2
            className="font-display text-text mt-3 text-3xl font-bold sm:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            {t('title')}
          </h2>
          <p className="text-text2 mt-4 text-base sm:text-lg">{t('description')}</p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-4">
          {samples.map((s) => (
            <div key={s.id} className="group">
              <div className="border-brand-border overflow-hidden rounded-xl border shadow-sm transition-all group-hover:shadow-lg">
                <SampleCard sample={s} />
              </div>
              <div className="mt-3">
                <h3 className="font-display text-text text-base font-semibold">{s.title}</h3>
                <p className="text-text3 mt-0.5 text-xs">{s.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
