import { useRef, useState, useCallback, useEffect } from 'react'

export interface QualityPreset {
  label: string
  fps: number
  width: number
  height: number
  bitrate: number
}

export const QUALITY_PRESETS: QualityPreset[] = [
  { label: '1080p / 15fps (Recommended)', fps: 15, width: 1920, height: 1080, bitrate: 2_500_000 },
  { label: '1080p / 30fps', fps: 30, width: 1920, height: 1080, bitrate: 4_000_000 },
  { label: '720p / 15fps (Smaller)', fps: 15, width: 1280, height: 720, bitrate: 1_500_000 },
  { label: '720p / 30fps', fps: 30, width: 1280, height: 720, bitrate: 2_500_000 },
  { label: '480p / 15fps (Smallest)', fps: 15, width: 854, height: 480, bitrate: 800_000 },
]

export interface Recording {
  id: string
  blob: Blob
  url: string
  mimeType: string
  startedAt: Date
  duration: number
}

function pickMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/mp4;codecs=h264',
    'video/mp4',
    'video/webm',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `-${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  )
}

function fileExtension(mimeType: string): string {
  return mimeType.includes('mp4') ? 'mp4' : 'webm'
}

export function useScreenRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [keepRecordingOnTabSwitch, setKeepRecordingOnTabSwitch] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const startTimeRef = useRef<Date | null>(null)
  const startTimestampRef = useRef<number>(0)

  // Pause/resume based on tab visibility when toggle is OFF
  useEffect(() => {
    const handleVisibilityChange = () => {
      const recorder = mediaRecorderRef.current
      if (!recorder || !isRecording) return

      if (document.hidden) {
        if (!keepRecordingOnTabSwitch && recorder.state === 'recording') {
          recorder.pause()
        }
      } else {
        if (recorder.state === 'paused') {
          recorder.resume()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isRecording, keepRecordingOnTabSwitch])

  const startRecording = useCallback(async () => {
    setError(null)
    const preset = QUALITY_PRESETS[selectedQuality]

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: preset.fps, max: preset.fps },
          width: { ideal: preset.width, max: preset.width },
          height: { ideal: preset.height, max: preset.height },
        },
        audio: true,
      })
    } catch (err) {
      if ((err as DOMException).name !== 'NotAllowedError') {
        setError('Could not start screen capture. Please try again.')
      }
      return
    }

    streamRef.current = stream
    const mimeType = pickMimeType()
    const recorder = new MediaRecorder(stream, {
      mimeType: mimeType || undefined,
      videoBitsPerSecond: preset.bitrate,
    })

    chunksRef.current = []
    const startedAt = new Date()
    startTimeRef.current = startedAt
    startTimestampRef.current = performance.now()

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const duration = Math.round((performance.now() - startTimestampRef.current) / 1000)
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' })
      const url = URL.createObjectURL(blob)
      const id = crypto.randomUUID()

      setRecordings((prev) => [
        ...prev,
        { id, blob, url, mimeType: mimeType || 'video/webm', startedAt, duration },
      ])

      // Auto-download
      const a = document.createElement('a')
      a.href = url
      a.download = `recording-${formatTimestamp(startedAt)}.${fileExtension(mimeType)}`
      a.click()

      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setIsRecording(false)
    }

    // Stop recording if the user ends the screen share via browser UI
    stream.getVideoTracks()[0].onended = () => {
      if (recorder.state !== 'inactive') recorder.stop()
    }

    recorder.start(1000) // collect chunks every second
    mediaRecorderRef.current = recorder
    setIsRecording(true)
  }, [selectedQuality])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }, [])

  const removeRecording = useCallback((id: string) => {
    setRecordings((prev) => {
      const rec = prev.find((r) => r.id === id)
      if (rec) URL.revokeObjectURL(rec.url)
      return prev.filter((r) => r.id !== id)
    })
  }, [])

  return {
    isRecording,
    recordings,
    keepRecordingOnTabSwitch,
    setKeepRecordingOnTabSwitch,
    selectedQuality,
    setSelectedQuality,
    error,
    startRecording,
    stopRecording,
    removeRecording,
  }
}
