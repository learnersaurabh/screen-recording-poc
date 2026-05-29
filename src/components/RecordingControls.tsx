import type { SessionState } from '../hooks/useProctoringRecorder'
import { QUALITY_PRESETS } from '../hooks/useProctoringRecorder'

interface Props {
  sessionState: SessionState
  selectedQuality: number
  error: string | null
  onStart: () => void
  onEnd: () => void
  onQualityChange: (index: number) => void
}

export function RecordingControls({
  sessionState,
  selectedQuality,
  error,
  onStart,
  onEnd,
  onQualityChange,
}: Props) {
  const isActive = sessionState !== 'idle'

  return (
    <div className="controls-card">
      <div className="controls-row">
        <div className="quality-group">
          <label htmlFor="quality-select" className="field-label">
            Quality
          </label>
          <select
            id="quality-select"
            value={selectedQuality}
            onChange={(e) => onQualityChange(Number(e.target.value))}
            disabled={isActive}
            className="quality-select"
          >
            {QUALITY_PRESETS.map((preset, i) => (
              <option key={i} value={i}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="action-row">
        {!isActive ? (
          <button className="btn btn-start" onClick={onStart}>
            <span className="btn-icon">⏺</span> Start Session
          </button>
        ) : (
          <button className="btn btn-end" onClick={onEnd}>
            <span className="btn-icon">⏹</span> End Session
          </button>
        )}

        {sessionState === 'monitoring' && (
          <div className="monitoring-indicator">
            <span className="monitoring-dot" />
            Monitoring — recording starts when you leave
          </div>
        )}

        {sessionState === 'recording' && (
          <div className="recording-indicator">
            <span className="recording-dot" />
            Recording
          </div>
        )}
      </div>
    </div>
  )
}
