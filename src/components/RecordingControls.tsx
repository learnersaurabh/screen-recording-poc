import { QUALITY_PRESETS } from '../hooks/useScreenRecorder'

interface Props {
  isRecording: boolean
  keepRecordingOnTabSwitch: boolean
  selectedQuality: number
  error: string | null
  onStart: () => void
  onStop: () => void
  onToggleKeepRecording: (val: boolean) => void
  onQualityChange: (index: number) => void
}

export function RecordingControls({
  isRecording,
  keepRecordingOnTabSwitch,
  selectedQuality,
  error,
  onStart,
  onStop,
  onToggleKeepRecording,
  onQualityChange,
}: Props) {
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
            disabled={isRecording}
            className="quality-select"
          >
            {QUALITY_PRESETS.map((preset, i) => (
              <option key={i} value={i}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <div className="toggle-group">
          <label className="field-label" htmlFor="keep-recording-toggle">
            Record when tab is hidden
          </label>
          <button
            id="keep-recording-toggle"
            role="switch"
            aria-checked={keepRecordingOnTabSwitch}
            className={`toggle-btn ${keepRecordingOnTabSwitch ? 'toggle-on' : 'toggle-off'}`}
            onClick={() => onToggleKeepRecording(!keepRecordingOnTabSwitch)}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="action-row">
        {!isRecording ? (
          <button className="btn btn-start" onClick={onStart}>
            <span className="btn-icon">⏺</span> Start Recording
          </button>
        ) : (
          <button className="btn btn-stop" onClick={onStop}>
            <span className="btn-icon recording-pulse">⏹</span> Stop Recording
          </button>
        )}

        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot" />
            Recording in progress
          </div>
        )}
      </div>
    </div>
  )
}
