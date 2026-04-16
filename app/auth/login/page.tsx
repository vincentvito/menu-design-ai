'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { authClient, useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandMark } from '@/components/brand/BrandMark'
import { OtpInput } from '@/components/auth/OtpInput'

const OTP_LENGTH = 6

export default function LoginPage() {
  const t = useTranslations('Auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get('callbackUrl') || '/dashboard'
  const callbackUrl =
    rawCallback.startsWith('/') && !rawCallback.startsWith('//') ? rawCallback : '/dashboard'
  const { data: session } = useSession()

  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session) router.push(callbackUrl)
  }, [session, router, callbackUrl])

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: 'sign-in',
      })
      if (res.error) {
        setError(res.error.message ?? t('errors.sendFailed'))
      } else {
        setStep('otp')
      }
    } catch {
      setError(t('errors.sendFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(code: string) {
    setLoading(true)
    setError('')
    try {
      const res = await authClient.signIn.emailOtp({ email: email.trim(), otp: code })
      if (res.error) {
        setError(res.error.message ?? t('errors.invalidCode'))
        setOtp(Array(OTP_LENGTH).fill(''))
      } else {
        router.push(callbackUrl)
      }
    } catch {
      setError(t('errors.verifyFailed'))
      setOtp(Array(OTP_LENGTH).fill(''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="bg-cream flex min-h-screen items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <BrandMark size="lg" />
          </Link>
        </div>

        <div className="bg-card border-border rounded-2xl border p-8 shadow-sm">
          {step === 'email' ? (
            <form onSubmit={sendOtp} className="space-y-5">
              <div className="space-y-1.5 text-center">
                <h1 className="font-display text-2xl font-bold tracking-tight">{t('signIn')}</h1>
                <p className="text-muted-foreground text-sm">{t('sendCodePrompt')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {error && <p className="text-destructive text-center text-xs">{error}</p>}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : t('sendCode')}
              </Button>
            </form>
          ) : (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setError('')
                  setOtp(Array(OTP_LENGTH).fill(''))
                }}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
              >
                <ArrowLeft className="size-3" />
                {t('back')}
              </button>

              <div className="space-y-1.5">
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  {t('checkEmail')}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {t.rich('codeSent', {
                    email: () => <span className="text-foreground font-medium">{email}</span>,
                  })}
                </p>
              </div>

              <OtpInput value={otp} onChange={setOtp} onComplete={verifyOtp} disabled={loading} />

              {error && <p className="text-destructive text-center text-xs">{error}</p>}

              {loading && (
                <div className="flex justify-center">
                  <Loader2 className="text-muted-foreground size-4 animate-spin" />
                </div>
              )}

              <p className="text-muted-foreground text-center text-xs">
                {t('noCode')}{' '}
                <button
                  type="button"
                  onClick={() => sendOtp()}
                  className="text-foreground font-medium underline-offset-2 hover:underline"
                  disabled={loading}
                >
                  {t('resend')}
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          {t.rich('terms', {
            tos: (chunks) => (
              <Link
                href="/terms"
                className="hover:text-foreground underline-offset-2 hover:underline"
              >
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link
                href="/privacy"
                className="hover:text-foreground underline-offset-2 hover:underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </main>
  )
}
