'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ScrollScrubVideoProps {
  /** Base path to the frame sequence, minus the numeric suffix. */
  framePath: string
  /** Total number of frames. Filenames become `${framePath}-${n}.${ext}`. */
  frameCount: number
  /** Zero-padding width for frame indices (default 3 → `001`, `002`...). */
  pad?: number
  /** First frame index (ffmpeg starts at 1 by default). */
  startIndex?: number
  /** File extension — defaults to 'webp'. */
  ext?: string
  /** Intrinsic width of a frame (px). Used for cover math. */
  imageWidth: number
  /** Intrinsic height of a frame (px). */
  imageHeight: number
  /** Section height in viewport multiples (3 = 300vh). */
  scrollLength?: number
  /**
   * Scroll progress at which the first frame is shown (0–1, default 0).
   * Before this, the canvas is transparent — useful for intro copy.
   */
  framesStartProgress?: number
  /**
   * Scroll progress at which the canvas is fully opaque (0–1, default 0).
   * Between `framesStartProgress` and this, the canvas fades in.
   */
  framesFadeInProgress?: number
  /** Scroll progress at which the last frame is shown (0–1, default 1). */
  framesEndProgress?: number
  /** Absolutely-positioned overlay (title, CTAs, etc.) — no rerenders on scroll. */
  children?: ReactNode
  className?: string
}

const lerpClamp = (value: number, from: number, to: number) => {
  if (to <= from) return value >= to ? 1 : 0
  return Math.min(1, Math.max(0, (value - from) / (to - from)))
}

export function ScrollScrubVideo({
  framePath,
  frameCount,
  pad = 3,
  startIndex = 1,
  ext = 'webp',
  imageWidth,
  imageHeight,
  scrollLength = 3,
  framesStartProgress = 0,
  framesFadeInProgress = 0,
  framesEndProgress = 1,
  children,
  className,
}: ScrollScrubVideoProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const framesRef = useRef<HTMLImageElement[]>([])
  const rafRef = useRef<number | null>(null)
  const lastFrameRef = useRef(-1)
  const [loaded, setLoaded] = useState(0)
  const [ready, setReady] = useState(false)

  // Preload frames. We draw the first one as soon as it decodes so the canvas
  // isn't blank during the rest of the load.
  useEffect(() => {
    let cancelled = false
    const frames: HTMLImageElement[] = []
    let loadedCount = 0

    for (let i = 0; i < frameCount; i += 1) {
      const n = String(i + startIndex).padStart(pad, '0')
      const img = new Image()
      img.decoding = 'async'
      img.src = `${framePath}-${n}.${ext}`
      const done = () => {
        if (cancelled) return
        loadedCount += 1
        setLoaded(loadedCount)
        if (loadedCount === frameCount) setReady(true)
      }
      img.onload = done
      img.onerror = done
      frames.push(img)
    }

    framesRef.current = frames
    return () => {
      cancelled = true
      frames.forEach((img) => {
        img.onload = null
        img.onerror = null
      })
    }
  }, [framePath, frameCount, pad, startIndex, ext])

  // Size canvas backing store to the viewport × DPR so the video stays crisp.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const sync = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      lastFrameRef.current = -1
    }
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  // Scroll → frame index, plus a `--progress` CSS var the overlay can react to.
  useEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    if (!section || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const drawCover = (img: HTMLImageElement) => {
      const cw = canvas.width
      const ch = canvas.height
      const iw = imageWidth
      const ih = imageHeight
      const scale = Math.max(cw / iw, ch / ih)
      const dw = iw * scale
      const dh = ih * scale
      const dx = (cw - dw) / 2
      const dy = (ch - dh) / 2
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.clearRect(0, 0, cw, ch)
      ctx.drawImage(img, dx, dy, dw, dh)
    }

    let engaged = false
    const setEngaged = (next: boolean) => {
      if (next === engaged) return
      engaged = next
      document.body.classList.toggle('scroll-scrub-engaged', next)
    }

    const render = () => {
      rafRef.current = null
      const rect = section.getBoundingClientRect()
      const viewport = window.innerHeight
      const travel = rect.height - viewport
      if (travel <= 0) {
        setEngaged(false)
        return
      }
      const progress = Math.min(1, Math.max(0, -rect.top / travel))
      section.style.setProperty('--progress', progress.toFixed(4))

      // "Engaged" = the sticky canvas is actively pinned over the viewport.
      // Used by the nav to dim itself out of the way.
      setEngaged(rect.top <= 0 && rect.bottom >= viewport)

      const framesProgress = reduce
        ? 0
        : lerpClamp(progress, framesStartProgress, framesEndProgress)
      const frameIndex = Math.round(framesProgress * (frameCount - 1))
      if (frameIndex !== lastFrameRef.current) {
        const img = framesRef.current[frameIndex]
        if (img && img.complete && img.naturalWidth > 0) {
          drawCover(img)
          lastFrameRef.current = frameIndex
        }
      }
    }

    const onScroll = () => {
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(render)
    }

    render()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      document.body.classList.remove('scroll-scrub-engaged')
    }
  }, [frameCount, framesStartProgress, framesEndProgress, imageWidth, imageHeight])

  const fadeStart = framesStartProgress.toFixed(4)
  const fadeSpan = Math.max(framesFadeInProgress - framesStartProgress, 0.0001).toFixed(4)

  return (
    <section
      ref={sectionRef}
      className={cn('relative w-full', className)}
      style={{ height: `${scrollLength * 100}vh` }}
      aria-label="Scroll-driven product animation"
    >
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          style={{
            opacity: `clamp(0, calc((var(--progress, 0) - ${fadeStart}) / ${fadeSpan}), 1)`,
          }}
        />
        {children}
        {!ready && (
          <span className="sr-only">
            Loading animation frames: {loaded} of {frameCount}
          </span>
        )}
      </div>
    </section>
  )
}
