/**
 * TcIllustration — Reusable empty-state / onboarding SVG illustrations.
 *
 * Props:
 *   type: 'empty-parcels' | 'no-connections' | 'empty-canvas' |
 *         'scan-ready' | 'delivery-done' | 'not-found' | 'no-notifications'
 *   size: number (default 160)
 *   label: string (optional caption below illustration)
 */
const illustrations = {
  'empty-parcels': (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="60" width="120" height="80" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5"/>
      <path d="M40 76 L100 100 L160 76" stroke="#bfdbfe" strokeWidth="1.5"/>
      <rect x="82" y="60" width="36" height="80" fill="#dbeafe" opacity="0.5"/>
      <circle cx="100" cy="40" r="16" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5"/>
      <path d="M94 40 L98 44 L107 35" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="60" y="108" width="80" height="6" rx="3" fill="#dbeafe"/>
      <rect x="72" y="122" width="56" height="4" rx="2" fill="#eff6ff"/>
    </svg>
  ),

  'no-connections': (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="70" r="36" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5"/>
      <circle cx="100" cy="70" r="20" fill="#dbeafe"/>
      <path d="M82 70 Q100 54 118 70" stroke="#93c5fd" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M75 70 Q100 46 125 70" stroke="#bfdbfe" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <line x1="88" y1="58" x2="112" y2="82" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
      <line x1="112" y1="58" x2="88" y2="82" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
      <rect x="55" y="116" width="90" height="6" rx="3" fill="#dbeafe"/>
      <rect x="68" y="130" width="64" height="4" rx="2" fill="#eff6ff"/>
    </svg>
  ),

  'scan-ready': (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="55" y="30" width="90" height="90" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5"/>
      {/* QR pattern blocks */}
      <rect x="68" y="43" width="22" height="22" rx="2" fill="#1241a6" opacity="0.15"/>
      <rect x="110" y="43" width="22" height="22" rx="2" fill="#1241a6" opacity="0.15"/>
      <rect x="68" y="85" width="22" height="22" rx="2" fill="#1241a6" opacity="0.15"/>
      <rect x="72" y="47" width="14" height="14" rx="1" fill="#1241a6" opacity="0.5"/>
      <rect x="114" y="47" width="14" height="14" rx="1" fill="#1241a6" opacity="0.5"/>
      <rect x="72" y="89" width="14" height="14" rx="1" fill="#1241a6" opacity="0.5"/>
      <rect x="110" y="80" width="6" height="6" rx="1" fill="#1241a6" opacity="0.3"/>
      <rect x="120" y="80" width="6" height="6" rx="1" fill="#1241a6" opacity="0.3"/>
      <rect x="110" y="90" width="6" height="6" rx="1" fill="#1241a6" opacity="0.3"/>
      {/* Scanner line */}
      <line x1="55" y1="75" x2="145" y2="75" stroke="#1241a6" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6"/>
      <rect x="40" y="130" width="120" height="6" rx="3" fill="#dbeafe"/>
    </svg>
  ),

  'delivery-done': (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="72" r="40" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5"/>
      <path d="M82 72 L94 84 L118 60" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="45" y="120" width="110" height="6" rx="3" fill="#dcfce7"/>
      <rect x="60" y="134" width="80" height="4" rx="2" fill="#f0fdf4"/>
      {/* Sparkles */}
      <circle cx="52" cy="50" r="4" fill="#bbf7d0"/>
      <circle cx="148" cy="55" r="3" fill="#bbf7d0"/>
      <circle cx="60" cy="90" r="2.5" fill="#dcfce7"/>
      <circle cx="142" cy="88" r="2" fill="#dcfce7"/>
    </svg>
  ),

  'not-found': (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="90" cy="72" r="38" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1.5"/>
      <circle cx="90" cy="72" r="26" fill="#ffedd5"/>
      <text x="90" y="80" textAnchor="middle" fontSize="24" fill="#d97706" fontFamily="monospace" fontWeight="bold">?</text>
      {/* Search handle */}
      <line x1="118" y1="100" x2="140" y2="122" stroke="#fed7aa" strokeWidth="4" strokeLinecap="round"/>
      <rect x="45" y="128" width="110" height="6" rx="3" fill="#ffedd5"/>
      <rect x="60" y="142" width="80" height="4" rx="2" fill="#fff7ed"/>
    </svg>
  ),

  'no-notifications': (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 36 C82 36 68 50 68 68 L68 90 L56 102 L144 102 L132 90 L132 68 C132 50 118 36 100 36Z" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5"/>
      <rect x="88" y="102" width="24" height="10" rx="5" fill="#bfdbfe"/>
      <line x1="66" y1="44" x2="134" y2="112" stroke="#f87171" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <rect x="45" y="126" width="110" height="6" rx="3" fill="#dbeafe"/>
      <rect x="60" y="140" width="80" height="4" rx="2" fill="#eff6ff"/>
    </svg>
  ),

  'empty-canvas': (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="24" width="140" height="96" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
      <rect x="30" y="24" width="140" height="20" rx="6" fill="#f1f5f9"/>
      <circle cx="46" cy="34" r="4" fill="#e2e8f0"/>
      <circle cx="60" cy="34" r="4" fill="#e2e8f0"/>
      <circle cx="74" cy="34" r="4" fill="#e2e8f0"/>
      {/* Dashed centre area */}
      <rect x="50" y="58" width="100" height="48" rx="4" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="6 3"/>
      <path d="M94 78 L100 72 L106 78 M100 72 L100 90" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="45" y="132" width="110" height="6" rx="3" fill="#f1f5f9"/>
    </svg>
  ),
}

function TcIllustration({ type = 'empty-parcels', size = 160, label = '' }) {
  const svg = illustrations[type] || illustrations['empty-parcels']

  return (
    <div className="tc-illustration" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: size, height: size * 0.8 }}>
        {svg}
      </div>
      {label && (
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          maxWidth: '220px',
          lineHeight: 1.5,
        }}>
          {label}
        </p>
      )}
    </div>
  )
}

export default TcIllustration
