import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Instagram, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { SocialPost } from '@/lib/mock-data'

interface PostCardProps {
  post: SocialPost
}

export const PostCard = memo(function PostCard({ post }: PostCardProps) {
  const t = useTranslations('Social.post')
  const Icon = post.platform === 'story' ? BookOpen : Instagram

  return (
    <Card className="border-brand-border bg-card overflow-hidden p-0 transition-shadow hover:shadow-md">
      <div
        role="img"
        aria-label={`${t(`platform.${post.platform}`)} post preview: ${post.title}`}
        className="relative flex aspect-square items-end p-5"
        style={{ background: post.gradient }}
      >
        <div className="absolute top-4 left-4 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur">
          <Icon className="size-3" aria-hidden="true" />
          {t(`platform.${post.platform}`)}
        </div>

        <h3
          className="font-display text-xl leading-tight font-bold text-white"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}
        >
          {post.title}
        </h3>
      </div>

      <div className="space-y-2 p-4">
        <p className="text-text2 text-xs leading-relaxed">{post.caption}</p>
        <div className="flex flex-wrap gap-1">
          {post.hashtags.map((tag) => (
            <span key={tag} className="text-pill-blue-fg text-[11px] font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
})
