'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { BrandMark } from '@/components/brand/BrandMark'

interface MobileNavProps {
  links: { href: string; label: string }[]
  signInLabel: string
  ctaLabel: string
  menuLabel: string
}

export function MobileNav({ links, signInLabel, ctaLabel, menuLabel }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={menuLabel}
          className="text-text hover:bg-g50 md:hidden"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-cream w-[18rem] sm:w-[22rem]">
        <SheetHeader className="text-left">
          <SheetTitle>
            <BrandMark size="md" />
          </SheetTitle>
          <SheetDescription className="sr-only">Main navigation</SheetDescription>
        </SheetHeader>

        <nav className="mt-2 flex flex-col gap-1 px-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-text hover:bg-g50 flex min-h-[48px] items-center rounded-lg px-3 text-base font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="border-brand-border mt-auto flex flex-col gap-2 border-t p-4">
          <Button asChild variant="outline" size="lg" className="border-brand-border bg-white">
            <Link href="/auth/login" onClick={() => setOpen(false)}>
              {signInLabel}
            </Link>
          </Button>
          <Button asChild size="lg" className="bg-amber text-pill-amber-fg hover:bg-amber/90">
            <Link href="/auth/login" onClick={() => setOpen(false)}>
              {ctaLabel}
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
