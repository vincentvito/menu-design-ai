'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Check, X, ArrowRight, ArrowLeft, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BrandMark } from '@/components/brand/BrandMark'
import { cn } from '@/lib/utils'
import { WIZARD_STEPS, type WizardStepKey } from './useWizard'

interface WizardShellProps {
  stepIndex: number
  canContinue: boolean
  blockReason?: string
  onBack: () => void
  onNext: () => void
  onGoTo: (index: number) => void
  onFinish: () => void
  children: React.ReactNode
}

export function WizardShell({
  stepIndex,
  canContinue,
  blockReason,
  onBack,
  onNext,
  onGoTo,
  onFinish,
  children,
}: WizardShellProps) {
  const t = useTranslations('Wizard')
  const isLast = stepIndex === WIZARD_STEPS.length - 1
  const isFirst = stepIndex === 0
  const progress = ((stepIndex + 1) / WIZARD_STEPS.length) * 100
  const blockedHintId = 'wizard-blocked-hint'

  return (
    <div className="bg-cream min-h-screen">
      {/* Top bar */}
      <header className="border-brand-border bg-cream/95 supports-[backdrop-filter]:bg-cream/80 sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="inline-flex items-center">
            <BrandMark size="md" />
          </Link>

          <div className="hidden max-w-xl flex-1 sm:block">
            <Progress
              value={progress}
              aria-label={t('stepLabel', { current: stepIndex + 1, total: WIZARD_STEPS.length })}
              className="h-1.5"
            />
            <p className="text-text3 mt-2 text-center text-[11px] font-medium tracking-wide uppercase">
              {t('stepLabel', { current: stepIndex + 1, total: WIZARD_STEPS.length })}
            </p>
          </div>

          <Button asChild variant="ghost" size="sm" className="text-text2">
            <Link href="/dashboard/menus" aria-label={t('exit')}>
              <X className="size-4" />
              <span className="hidden sm:inline">{t('exit')}</span>
            </Link>
          </Button>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
          <StepSidebar stepIndex={stepIndex} onGoTo={onGoTo} />

          <div className="min-w-0">
            <div className="animate-fade-up">{children}</div>

            <div className="border-brand-border mt-10 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="ghost"
                onClick={onBack}
                disabled={isFirst}
                className="text-text2 self-start"
              >
                <ArrowLeft className="size-4" />
                {t('back')}
              </Button>

              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                {!canContinue && blockReason && (
                  <p
                    id={blockedHintId}
                    className="text-destructive order-2 text-xs sm:order-1"
                    role="status"
                  >
                    {blockReason}
                  </p>
                )}

                {isLast ? (
                  <Button
                    onClick={onFinish}
                    disabled={!canContinue}
                    aria-describedby={!canContinue && blockReason ? blockedHintId : undefined}
                    size="lg"
                    className="bg-amber text-pill-amber-fg hover:bg-amber/90 order-1 sm:order-2"
                  >
                    <Rocket className="size-4" />
                    {t('finish')}
                  </Button>
                ) : (
                  <Button
                    onClick={onNext}
                    disabled={!canContinue}
                    aria-describedby={!canContinue && blockReason ? blockedHintId : undefined}
                    size="lg"
                    className="bg-g800 hover:bg-g700 order-1 text-white sm:order-2"
                  >
                    {t('next')}
                    <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StepSidebar({
  stepIndex,
  onGoTo,
}: {
  stepIndex: number
  onGoTo: (index: number) => void
}) {
  const t = useTranslations('Wizard')

  return (
    <nav className="lg:sticky lg:top-24 lg:self-start" aria-label="Wizard steps">
      {/* Mobile progress breadcrumb */}
      <ol className="flex justify-between gap-1 lg:hidden">
        {WIZARD_STEPS.map((key, i) => {
          const active = i === stepIndex
          const done = i < stepIndex
          return (
            <li key={key} className="flex-1">
              <button
                type="button"
                onClick={() => (done ? onGoTo(i) : undefined)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex min-h-[44px] w-full flex-col items-center gap-1 rounded-md px-1 py-2 text-[10px] font-medium transition-colors',
                  active ? 'bg-g50 text-g800' : done ? 'text-g600 hover:text-g800' : 'text-text3',
                )}
                disabled={!done && !active}
              >
                <StepDot index={i} active={active} done={done} />
                <span>{t(`steps.${key}.short`)}</span>
                <span className="sr-only">
                  {done ? '(completed)' : active ? '(current)' : '(upcoming)'}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {/* Desktop vertical list */}
      <ol className="hidden space-y-1 lg:block">
        {WIZARD_STEPS.map((key, i) => {
          const active = i === stepIndex
          const done = i < stepIndex
          const allowed = i <= stepIndex
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => (allowed ? onGoTo(i) : undefined)}
                disabled={!allowed}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  active && 'bg-g800 text-white',
                  !active && done && 'text-g800 hover:bg-g50',
                  !active && !done && 'text-text3',
                )}
              >
                <StepDot index={i} active={active} done={done} />
                <span className="font-display font-semibold">{t(`steps.${key}.title`)}</span>
                <span className="sr-only">
                  {done ? '(completed)' : active ? '(current)' : '(upcoming)'}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function StepDot({ index, active, done }: { index: number; active: boolean; done: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
        active && 'bg-amber text-pill-amber-fg',
        !active && done && 'bg-pill-green-bg text-pill-green-fg',
        !active && !done && 'bg-g50 text-text3 ring-brand-border ring-1',
      )}
    >
      {done ? <Check className="size-3" /> : index + 1}
    </span>
  )
}

export function WizardStep({
  title,
  description,
  children,
  stepKey,
}: {
  title: string
  description: string
  children: React.ReactNode
  stepKey: WizardStepKey
}) {
  return (
    <section aria-labelledby={`wizard-${stepKey}-title`}>
      <header className="mb-6">
        <h1
          id={`wizard-${stepKey}-title`}
          className="font-display text-text text-2xl font-bold sm:text-3xl"
        >
          {title}
        </h1>
        <p className="text-text2 mt-2 text-sm sm:text-base">{description}</p>
      </header>
      {children}
    </section>
  )
}
