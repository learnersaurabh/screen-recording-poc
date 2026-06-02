import { useState } from 'react'
import type { SessionState } from '../hooks/useProctoringRecorder'

interface Props {
  sessionState: SessionState
  encodeRateKBps: number
  fps: number
  heapUsedMB: number
  heapLimitMB: number
  heapPct: number
  heapSupported: boolean
}

function fpsClass(fps: number): string {
  if (fps === 0) return ''
  if (fps >= 50) return 'perf-green'
  if (fps >= 30) return 'perf-yellow'
  return 'perf-red'
}

function heapClass(pct: number): string {
  if (pct === 0) return ''
  if (pct < 50) return 'perf-green'
  if (pct < 75) return 'perf-yellow'
  return 'perf-red'
}

export function PerformancePanel({
  sessionState,
  encodeRateKBps,
  fps,
  heapUsedMB,
  heapLimitMB,
  heapPct,
  heapSupported,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="perf-panel">
      <button className="perf-toggle" onClick={() => setOpen((o) => !o)}>
        <span>Performance</span>
        <span className="perf-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="perf-metrics">
          <div className="perf-metric">
            <span className="perf-label">FPS</span>
            <span className={`perf-value ${fpsClass(fps)}`}>{fps > 0 ? fps : '—'}</span>
          </div>

          <div className="perf-divider" />

          <div className="perf-metric">
            <span className="perf-label">JS Heap</span>
            {heapSupported ? (
              <span className={`perf-value ${heapClass(heapPct)}`}>
                {heapUsedMB} / {heapLimitMB} MB
                <span className="perf-pct"> ({heapPct}%)</span>
              </span>
            ) : (
              <span className="perf-value perf-muted">N/A (non-Chrome)</span>
            )}
          </div>

          <div className="perf-divider" />

          <div className="perf-metric">
            <span className="perf-label">Encode rate</span>
            <span className="perf-value">
              {sessionState === 'recording' ? `${encodeRateKBps.toFixed(1)} KB/s` : '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
