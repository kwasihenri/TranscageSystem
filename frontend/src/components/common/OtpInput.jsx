import { useRef } from 'react'

/**
 * OtpInput — 6 individual digit boxes with auto-advance, backspace, and paste support.
 *
 * Props:
 *   value    string   — current 6-char string
 *   onChange fn       — called with updated string
 *   disabled bool
 *   autoFocus bool
 */
function OtpInput({ value = '', onChange, disabled = false, autoFocus = false }) {
  const inputs = useRef([])
  const digits  = (value + '      ').slice(0, 6).split('')

  function handleKey(e, i) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = digits.slice()
      if (next[i]?.trim()) {
        next[i] = ''
      } else if (i > 0) {
        next[i - 1] = ''
        inputs.current[i - 1]?.focus()
      }
      onChange(next.join('').trimEnd())
      return
    }
    if (e.key === 'ArrowLeft'  && i > 0) { inputs.current[i - 1]?.focus(); return }
    if (e.key === 'ArrowRight' && i < 5) { inputs.current[i + 1]?.focus(); return }
  }

  function handleChange(e, i) {
    const char = e.target.value.replace(/\D/g, '').slice(-1)
    if (!char) return
    const next = digits.slice()
    next[i] = char
    onChange(next.join('').trimEnd())
    if (i < 5) inputs.current[i + 1]?.focus()
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    inputs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div className="otp-input-row" aria-label="Enter 6-digit OTP">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          className={`otp-box${d.trim() ? ' filled' : ''}`}
          value={d.trim()}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  )
}

export default OtpInput
