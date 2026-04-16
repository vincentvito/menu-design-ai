'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Sparkles, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TopBar } from '@/components/layout/TopBar'
import { PostCard } from '@/components/social/PostCard'
import { SocialFilterPills, type SocialFilter } from '@/components/social/SocialFilterPills'
import { SAMPLE_SOCIAL_POSTS } from '@/lib/mock-data'

export default function SocialPage() {
  const t = useTranslations('Social')
  const locale = useLocale()
  const [filter, setFilter] = useState<SocialFilter>('all')

  const posts = useMemo(
    () =>
      filter === 'all'
        ? SAMPLE_SOCIAL_POSTS
        : SAMPLE_SOCIAL_POSTS.filter((p) => p.platform === filter),
    [filter],
  )

  return (
    <>
      <TopBar title={t('title')} subtitle={t('subtitle')} locale={locale} />

      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <SocialFilterPills value={filter} onChange={setFilter} />
          <div className="flex gap-2">
            <Button variant="outline" className="border-brand-border bg-white">
              <Download className="size-4" aria-hidden="true" />
              {t('exportZip')}
            </Button>
            <Button className="bg-amber text-pill-amber-fg hover:bg-amber/90">
              <Sparkles className="size-4" aria-hidden="true" />
              {t('generate')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </>
  )
}
