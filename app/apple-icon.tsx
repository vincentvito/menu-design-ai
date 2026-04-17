import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        borderRadius: 40,
        background: '#1c3829',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#c9922a',
        }}
      />
      <span
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 108,
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#faf8f3',
          lineHeight: 1,
          marginTop: 12,
        }}
      >
        M
      </span>
    </div>,
    { ...size },
  )
}
