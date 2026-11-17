import { JOURNEY_STEPS, STATUS_CONFIG } from '../../constants/parcel'
import './TrackingTimeline.css'

/**
 * TrackingTimeline — vertical step-by-step journey view.
 *
 * Props:
 *   currentStatus  string  — current parcel status key
 *   history        array   — [{status, note, timestamp}]  (optional)
 */
function TrackingTimeline({ currentStatus = 'created', history = [] }) {
  const currentStep = STATUS_CONFIG[currentStatus]?.step ?? 0

  /* Merge history events by status for annotation */
  const historyMap = {}
  history.forEach((h) => { historyMap[h.status] = h })

  return (
    <div className="tracking-timeline">
      {JOURNEY_STEPS.map((step, idx) => {
        const done    = idx < currentStep
        const active  = idx === currentStep
        const future  = idx > currentStep
        const event   = historyMap[step.status]

        return (
          <div
            key={step.status}
            className={`timeline-step${done ? ' done' : ''}${active ? ' active' : ''}${future ? ' future' : ''}`}
          >
            {/* Connector line above (skip first) */}
            {idx > 0 && (
              <div className={`timeline-connector${done || active ? ' filled' : ''}`} />
            )}

            <div className="timeline-row">
              {/* Dot */}
              <div className="timeline-dot-wrap">
                <span className={`timeline-dot${done ? ' dot-done' : active ? ' dot-active' : ' dot-future'}`}>
                  {done ? '✓' : idx + 1}
                </span>
              </div>

              {/* Content */}
              <div className="timeline-content">
                <div className="timeline-step-label">{step.label}</div>
                {event ? (
                  <>
                    <div className="timeline-note">{event.note}</div>
                    <div className="timeline-time">
                      {new Date(event.timestamp).toLocaleString('en-GH', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </div>
                  </>
                ) : (
                  <div className="timeline-note future-note">{step.desc}</div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TrackingTimeline
