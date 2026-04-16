'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { WizardShell } from '@/components/wizard/WizardShell'
import { useWizard, WIZARD_STEPS } from '@/components/wizard/useWizard'
import { Step1Upload } from '@/components/wizard/steps/Step1Upload'
import { Step2Style } from '@/components/wizard/steps/Step2Style'
import { Step3Enrichment } from '@/components/wizard/steps/Step3Enrichment'
import { Step4Designs } from '@/components/wizard/steps/Step4Designs'
import { Step5Export } from '@/components/wizard/steps/Step5Export'

export default function NewMenuWizardPage() {
  const router = useRouter()
  const t = useTranslations('Wizard')
  const { state, dispatch, goNext, goBack, goTo, canContinue, blockKey } = useWizard()
  const stepKey = WIZARD_STEPS[state.stepIndex]

  function handleFinish() {
    toast.success(t('toast.published.title'), {
      description: t('toast.published.description'),
    })
    router.push('/dashboard/menus')
  }

  const blockReason = !canContinue && blockKey ? t(`blocked.${blockKey}` as const) : undefined

  const stepProps = { state, dispatch }

  return (
    <WizardShell
      stepIndex={state.stepIndex}
      canContinue={canContinue}
      blockReason={blockReason}
      onBack={goBack}
      onNext={goNext}
      onGoTo={goTo}
      onFinish={handleFinish}
    >
      {stepKey === 'upload' && <Step1Upload {...stepProps} />}
      {stepKey === 'style' && <Step2Style {...stepProps} />}
      {stepKey === 'enrich' && <Step3Enrichment {...stepProps} />}
      {stepKey === 'design' && <Step4Designs {...stepProps} />}
      {stepKey === 'export' && <Step5Export {...stepProps} />}
    </WizardShell>
  )
}
