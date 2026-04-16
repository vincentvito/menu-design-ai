import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { listUserMenus } from '@/lib/menus/list'
import { MenusView } from './menus-view'

export default async function MyMenusPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const menus = await listUserMenus(session!.user.id)
  return <MenusView menus={menus} />
}
