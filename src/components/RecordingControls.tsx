import type { SessionState } from '../hooks/useProctoringRecorder'
import { QUALITY_PRESETS } from '../hooks/useProctoringRecorder'

interface Props {
  sessionState: SessionState
  selectedQuality: number
  error: string | null
  monitorCount: number | null
  isMultiMonitor: boolean
  multiMonitorAcknowledged: boolean
  onStart: () => void
  onEnd: () => void
  onQualityChange: (index: number) => void
  onAcknowledgeChange: (v: boolean) => void
}

export function RecordingControls({
  sessionState,
  selectedQuality,
  error,
  monitorCount,
  isMultiMonitor,
  multiMonitorAcknowledged,
  onStart,
  onEnd,
  onQualityChange,
  onAcknowledgeChange,
}: Props) {
  const isActive = sessionState !== 'idle'
  const needsAck = isMultiMonitor && !multiMonitorAcknowledged

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

        <div className="monitor-badge">
          <span className={isMultiMonitor ? 'monitor-multi' : 'monitor-single'}>
            {monitorCount !== null
              ? monitorCount === 1 ? '1 monitor' : `${monitorCount} monitors detected`
              : isMultiMonitor ? 'Multiple monitors detected' : '1 monitor'}
          </span>
        </div>
      </div>

      {isMultiMonitor && !isActive && (
        <div className="monitor-gate">
          <p className="monitor-warning">
            ⚠ {monitorCount !== null ? `${monitorCount} monitors` : 'Multiple monitors'} detected — make sure you share the correct screen.
          </p>
          <label className="monitor-ack">
            <input
              type="checkbox"
              checked={multiMonitorAcknowledged}
              onChange={(e) => onAcknowledgeChange(e.target.checked)}
            />
            I confirm I will share the correct screen
          </label>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <div className="action-row">
        {!isActive ? (
          <button
            className="btn btn-start"
            onClick={onStart}
            disabled={needsAck}
          >
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
