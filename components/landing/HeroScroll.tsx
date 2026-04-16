import { ScrollScrubVideo } from './ScrollScrubVideo'

const FRAME_PATH = '/hero-scroll/frame'
const FRAME_COUNT = 64
const FRAME_WIDTH = 1920
const FRAME_HEIGHT = 1080

export function HeroScroll() {
  return (
    <ScrollScrubVideo
      framePath={FRAME_PATH}
      frameCount={FRAME_COUNT}
      pad={3}
      startIndex={1}
      ext="webp"
      imageWidth={FRAME_WIDTH}
      imageHeight={FRAME_HEIGHT}
      scrollLength={4}
      framesStartProgress={0.18}
      framesFadeInProgress={0.32}
      framesEndProgress={1}
      className="bg-cream"
    >
      <div className="scroll-scrub-title pointer-events-none absolute inset-x-0 top-1/2 z-10 mx-auto max-w-3xl px-5 text-center">
        <p className="text-pill-amber-fg/80 font-display text-xs font-semibold tracking-[0.3em] uppercase">
          See it in motion
        </p>
        <h2
          className="font-display text-text mt-4 font-bold"
          style={{
            fontSize: 'clamp(2rem, 5vw + 0.5rem, 4.5rem)',
            lineHeight: 1.05,
            textWrap: 'balance',
          }}
        >
          From a messy list of dishes to a{' '}
          <span className="text-amber italic">print-ready menu</span>.
        </h2>
      </div>
    </ScrollScrubVideo>
  )
}
