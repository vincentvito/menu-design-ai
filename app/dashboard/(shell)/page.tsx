import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { listUserMenus } from '@/lib/menus/list'
import { DashboardView } from './dashboard-view'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  // Route is gated in app/dashboard/layout.tsx — session is guaranteed here.
  const user = session!.user
  const menus = await listUserMenus(user.id, 6)
  return <DashboardView user={user} menus={menus} />
}
