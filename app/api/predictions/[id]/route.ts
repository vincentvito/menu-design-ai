import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  const row = await prisma.prediction.findUnique({
    where: { id },
    include: { design: { select: { userId: true } } },
  })

  if (!row || row.design.userId !== session.user.id) {
    return NextResponse.json({ detail: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: row.id,
    status: row.status,
    output: row.storageUrl ?? null,
    error: row.error ?? null,
  })
}
