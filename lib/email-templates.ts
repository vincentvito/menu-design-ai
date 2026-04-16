type OtpType = 'sign-in' | 'email-verification' | 'forget-password'

interface OtpTemplateParams {
  otp: string
  type: OtpType
}

export function otpEmailTemplate({ otp, type }: OtpTemplateParams) {
  const subject =
    type === 'sign-in'
      ? 'Your MenuAI login code'
      : type === 'email-verification'
        ? 'Verify your MenuAI email'
        : 'Reset your MenuAI password'

  const actionText =
    type === 'sign-in'
      ? 'Use this code to sign in to your MenuAI account:'
      : type === 'email-verification'
        ? 'Use this code to verify your email address:'
        : 'Use this code to reset your password:'

  const html = `
    <div style="font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif; background-color: #faf8f3; padding: 0;">
      <div style="max-width: 520px; margin: 0 auto; padding: 48px 24px;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #1a2e20; margin: 0 0 4px 0; letter-spacing: -0.015em;">
            MenuAI
          </h1>
          <p style="font-size: 13px; color: #4d6355; margin: 0;">Restaurant menus, designed by AI</p>
        </div>

        <p style="font-size: 14px; color: #4d6355; line-height: 1.6; margin: 0 0 24px 0;">
          ${actionText}
        </p>

        <div style="background-color: #ffffff; border: 1px solid #dee8e1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #1c3829; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;">
            ${otp}
          </div>
        </div>

        <p style="font-size: 13px; color: #4d6355; line-height: 1.5; margin: 0 0 8px 0;">
          This code expires in <strong style="color: #1c3829;">5 minutes</strong>.
        </p>
        <p style="font-size: 13px; color: #8fa393; line-height: 1.5; margin: 0;">
          If you didn't request this code, you can safely ignore this email.
        </p>

        <div style="height: 1px; background-color: #dee8e1; margin: 32px 0;"></div>

        <p style="font-size: 11px; color: #8fa393; margin: 0;">
          MenuAI &mdash; Turn any menu into a print-ready design + QR in under 60 seconds
        </p>
      </div>
    </div>
  `

  return { subject, html }
}
