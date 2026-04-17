import { getTranslations } from 'next-intl/server'

interface Sample {
  id: string
  title: string
  subtitle: string
  src: string
  alt: string
}

const samples: Sample[] = [
  {
    id: 'bold',
    title: 'Bold & Dramatic',
    subtitle: 'Black + gold · serif',
    src: '/showcase/le-petit-bistro.webp',
    alt: 'Le Petit Bistro — a dark, gilded French menu with gold accents',
  },
  {
    id: 'vintage',
    title: 'Classic Vintage',
    subtitle: 'Parchment · editorial',
    src: '/showcase/la-bella-vita.webp',
    alt: 'La Bella Vita — a vintage Italian trattoria menu on parchment',
  },
  {
    id: 'minimal',
    title: 'Minimal Elegance',
    subtitle: 'Grid · contemporary',
    src: '/showcase/verdant.webp',
    alt: 'Verdant — a modern plant-based menu with a clean editorial grid',
  },
  {
    id: 'photo',
    title: 'Photo-Centric',
    subtitle: 'Tasting · imagery-led',
    src: '/showcase/sakura.webp',
    alt: 'Sakura Omakase — a photo-led Japanese tasting menu',
  },
]

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
          {samples.map((s, i) => (
            <div key={s.id} className="group">
              <div
                className="border-brand-border bg-card group-hover:border-amber/50 relative aspect-[3/4] overflow-hidden rounded-xl border shadow-sm transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:-translate-y-1.5 group-hover:rotate-[0.4deg] group-hover:shadow-2xl"
                style={{ transformOrigin: i % 2 === 0 ? 'bottom left' : 'bottom right' }}
              >
                <img
                  src={s.src}
                  alt={s.alt}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:scale-[1.06]"
                />
                <div
                  aria-hidden="true"
                  className="from-g900/55 via-g900/10 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-4 bottom-4 translate-y-3 text-left opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100"
                >
                  <span className="text-amber font-display text-[10px] font-semibold tracking-[0.3em] uppercase">
                    Style {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="font-display mt-1 text-sm font-semibold text-white italic">
                    {s.title}
                  </p>
                </div>
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
