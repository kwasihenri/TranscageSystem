/**
 * TcIcon — Transcage brand logo/icon component.
 * Usage:
 *   <TcIcon size={32} />            → icon only (SVG box)
 *   <TcIcon size={32} wordmark />   → icon + "Transcage" wordmark
 */
function TcIcon({ size = 24, wordmark = false, className = '' }) {
  return (
    <span className={`tc-icon-wrap ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Transcage logo"
        role="img"
      >
        {/* Box body */}
        <rect x="4" y="10" width="24" height="18" rx="2" fill="#1241a6" />
        {/* Box flap */}
        <path d="M4 10 L16 16 L28 10 L22 6 L10 6 Z" fill="#1a52d4" />
        {/* Centre tape strip */}
        <rect x="13" y="6" width="6" height="22" rx="1" fill="#ffffff" opacity="0.18" />
        {/* Tracking chevron */}
        <path
          d="M10 20.5 L16 24.5 L22 20.5"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {wordmark && (
        <span
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 700,
            fontSize: size * 0.56,
            color: '#0f172a',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          Transcage
        </span>
      )}
    </span>
  )
}

export default TcIcon
