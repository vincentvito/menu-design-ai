import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const dmSans = DM_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
})

const playfair = Playfair_Display({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
})

const BASE_URL = 'https://menugenai.clickstudio.ai'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'MenuAI — Restaurant menus, designed by AI',
    template: '%s · MenuAI',
  },
  description:
    'Upload your menu, get a print-ready PDF design and hosted QR menu in under 60 seconds. No designer needed.',
  keywords: [
    'restaurant menu design',
    'AI menu generator',
    'menu design software',
    'QR menu',
    'digital menu',
    'print-ready menu',
    'restaurant branding',
    'menu maker',
  ],
  authors: [{ name: 'MenuAI' }],
  creator: 'MenuAI',
  applicationName: 'MenuAI',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'MenuAI',
    title: 'MenuAI — Restaurant menus, designed by AI',
    description:
      'Upload your menu, get a print-ready PDF design and hosted QR menu in under 60 seconds. No designer needed.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MenuAI — AI-designed restaurant menus',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MenuAI — Restaurant menus, designed by AI',
    description:
      'Upload your menu, get a print-ready PDF design and hosted QR menu in under 60 seconds.',
    images: ['/og-image.png'],
    creator: '@menuai',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={`${dmSans.variable} ${playfair.variable} bg-cream text-text antialiased`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <NextIntlClientProvider messages={messages}>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-center" richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
