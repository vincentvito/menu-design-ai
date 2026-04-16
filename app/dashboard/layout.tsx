import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

/**
 * Server-side auth gate covering all /dashboard/** routes (including the
 * (shell) group and /dashboard/menus/new). Unauthenticated visitors are
 * redirected to the login page with a callbackUrl so they return here after
 * signing in.
 */
export default async function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })

  if (!session) {
    redirect('/auth/login?callbackUrl=/dashboard')
  }

  return <>{children}</>
}
