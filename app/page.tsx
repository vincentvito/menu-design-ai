import { getLocale } from 'next-intl/server'
import { Nav } from '@/components/landing/Nav'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { SampleDesigns } from '@/components/landing/SampleDesigns'
import { PricingCards } from '@/components/landing/PricingCards'
import { CTABanner } from '@/components/landing/CTABanner'
import { Footer } from '@/components/landing/Footer'

export default async function LandingPage() {
  const locale = await getLocale()

  return (
    <div className="bg-cream text-text min-h-screen">
      <Nav locale={locale} />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <HowItWorks />
        <SampleDesigns />
        <PricingCards />
        <CTABanner />
      </main>
      <Footer />
    </div>
  )
}
