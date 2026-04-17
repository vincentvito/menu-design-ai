import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getMenuDetail } from '@/lib/menus/detail'
import { MenuDetailView } from './menu-detail-view'

export default async function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  const menu = await getMenuDetail(id, session!.user.id)
  if (!menu) notFound()
  return <MenuDetailView menu={menu} />
}
