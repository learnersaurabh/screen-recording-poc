import type { Recording } from '../hooks/useScreenRecorder'

interface Props {
  recordings: Recording[]
  onRemove: (id: string) => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function downloadRecording(recording: Recording) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const d = recording.startedAt
  const timestamp =
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `-${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
  const ext = recording.mimeType.includes('mp4') ? 'mp4' : 'webm'

  const a = document.createElement('a')
  a.href = recording.url
  a.download = `recording-${timestamp}.${ext}`
  a.click()
}

export function RecordingsList({ recordings, onRemove }: Props) {
  if (recordings.length === 0) return null

  return (
    <section className="recordings-section">
      <h2 className="section-title">Recordings ({recordings.length})</h2>
      <ul className="recordings-list">
        {recordings.map((rec) => (
          <li key={rec.id} className="recording-item">
            <div className="recording-meta">
              <span className="recording-timestamp">{formatDateTime(rec.startedAt)}</span>
              <span className="recording-duration">{formatDuration(rec.duration)}</span>
            </div>

            <video
              className="recording-preview"
              src={rec.url}
              controls
              preload="metadata"
            />

            <div className="recording-actions">
              <button
                className="btn btn-download"
                onClick={() => downloadRecording(rec)}
              >
                Download
              </button>
              <button
                className="btn btn-remove"
                onClick={() => onRemove(rec.id)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
