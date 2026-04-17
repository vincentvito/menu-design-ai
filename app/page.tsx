import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { Nav } from '@/components/landing/Nav'
import { Hero } from '@/components/landing/Hero'
import { HeroScroll } from '@/components/landing/HeroScroll'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { SampleDesigns } from '@/components/landing/SampleDesigns'
import { PricingCards } from '@/components/landing/PricingCards'
import { CTABanner } from '@/components/landing/CTABanner'
import { Footer } from '@/components/landing/Footer'

export const metadata: Metadata = {
  alternates: { canonical: 'https://menugenai.clickstudio.ai' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'MenuAI',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://menugenai.clickstudio.ai',
  description:
    'AI-powered restaurant menu design. Upload your menu and get a print-ready PDF and hosted QR menu in under 60 seconds.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free during private beta',
  },
  featureList: [
    'AI-generated menu designs',
    'Print-ready PDF export',
    'Hosted QR menu',
    'Multiple design variations',
    'Multilingual support',
  ],
}

export default async function LandingPage() {
  const locale = await getLocale()

  return (
    <div className="bg-cream text-text min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav locale={locale} />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <HeroScroll />
        <HowItWorks />
        <SampleDesigns />
        <PricingCards />
        <CTABanner />
      </main>
      <Footer />
    </div>
  )
}
