'use client'

import { useRef } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  value: string[]
  onChange: (next: string[]) => void
  onComplete?: (code: string) => void
  disabled?: boolean
  length?: number
  className?: string
}

/**
 * Segmented 6-digit OTP input. Handles paste, auto-advance, and backspace.
 * Calls `onComplete` once all digits are filled.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  length = 6,
  className,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function writeDigits(startIndex: number, digits: string[]) {
    const next = [...value]
    digits.forEach((d, i) => {
      if (startIndex + i < length) next[startIndex + i] = d
    })
    onChange(next)

    const lastFilled = Math.min(startIndex + digits.length, length - 1)
    refs.current[lastFilled]?.focus()

    if (next.every((d) => d !== '') && onComplete) {
      onComplete(next.join(''))
    }
  }

  function handleChange(index: number, raw: string) {
    if (raw.length > 1) {
      const digits = raw.replace(/\D/g, '').slice(0, length).split('')
      writeDigits(index, digits)
      return
    }
    const digit = raw.replace(/\D/g, '')
    const next = [...value]
    next[index] = digit
    onChange(next)
    if (digit && index < length - 1) refs.current[index + 1]?.focus()
    if (next.every((d) => d !== '') && onComplete) onComplete(next.join(''))
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  return (
    <div className={cn('flex justify-center gap-2', className)}>
      {value.map((digit, i) => (
        <Input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={length}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-12 w-11 text-center text-lg font-bold"
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}
