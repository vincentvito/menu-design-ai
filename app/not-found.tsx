import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/brand/BrandMark'

export default function NotFound() {
  return (
    <main className="bg-cream flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <BrandMark size="lg" />
      <p className="text-amber font-display mt-10 text-sm font-semibold tracking-[0.3em] uppercase">
        404
      </p>
      <h1 className="font-display text-text mt-3 text-3xl font-bold sm:text-4xl">
        We couldn&rsquo;t find that page
      </h1>
      <p className="text-text2 mt-3 max-w-sm text-sm sm:text-base">
        The link may be broken, or the page may have moved.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="bg-g800 hover:bg-g700 text-white">
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild variant="outline" className="border-brand-border bg-white">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </main>
  )
}
