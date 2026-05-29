import { useRef, useState, useCallback } from 'react'

export type SessionState = 'idle' | 'monitoring' | 'recording'

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


export function useProctoringRecorder() {
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [clips, setClips] = useState<Recording[]>([])
  const [selectedQuality, setSelectedQuality] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const clipStartRef = useRef<Date | null>(null)
  const clipStartPerfRef = useRef<number>(0)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionStateRef = useRef<SessionState>('idle')
  const mimeTypeRef = useRef<string>('')

  // Keep ref in sync so event listeners always see current state
  const updateSessionState = (state: SessionState) => {
    sessionStateRef.current = state
    setSessionState(state)
  }

  const finaliseClip = useCallback((addToList: (c: Recording) => void) => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || 'video/webm' })
      chunksRef.current = []
      recorderRef.current = null

      if (blob.size === 0) return

      const duration = Math.round((performance.now() - clipStartPerfRef.current) / 1000)
      const url = URL.createObjectURL(blob)
      const id = crypto.randomUUID()
      const startedAt = clipStartRef.current ?? new Date()

      addToList({ id, blob, url, mimeType: mimeTypeRef.current || 'video/webm', startedAt, duration })
    }

    recorder.stop()
  }, [])

  const startClip = useCallback((stream: MediaStream, quality: QualityPreset) => {
    const mimeType = mimeTypeRef.current
    const recorder = new MediaRecorder(stream, {
      mimeType: mimeType || undefined,
      videoBitsPerSecond: quality.bitrate,
    })

    chunksRef.current = []
    clipStartRef.current = new Date()
    clipStartPerfRef.current = performance.now()

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.start(1000)
    recorderRef.current = recorder
  }, [])

  const handleUserLeft = useCallback(() => {
    if (sessionStateRef.current !== 'monitoring') return
    const stream = streamRef.current
    const quality = QUALITY_PRESETS[selectedQuality]
    if (!stream) return
    startClip(stream, quality)
    updateSessionState('recording')
  }, [selectedQuality, startClip])

  const handleUserReturned = useCallback(() => {
    if (sessionStateRef.current !== 'recording') return
    if (document.hidden || !document.hasFocus()) return

    finaliseClip((clip) => setClips((prev) => [...prev, clip]))
    updateSessionState('monitoring')
  }, [finaliseClip])

  const scheduleUserLeft = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      handleUserLeft()
    }, 500)
  }, [handleUserLeft])

  const cancelDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [])

  const attachListeners = useCallback(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        scheduleUserLeft()
      } else {
        cancelDebounce()
        handleUserReturned()
      }
    }

    const onBlur = () => scheduleUserLeft()

    const onFocus = () => {
      cancelDebounce()
      handleUserReturned()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
    }
  }, [scheduleUserLeft, cancelDebounce, handleUserReturned])

  const detachListenersRef = useRef<(() => void) | null>(null)

  const startSession = useCallback(async () => {
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
      if ((err as DOMException).name === 'NotAllowedError') {
        setError('Screen share permission denied.')
      } else {
        setError('Could not start screen capture. Please try again.')
      }
      return
    }

    mimeTypeRef.current = pickMimeType()
    streamRef.current = stream

    // Handle user stopping the share via browser's native "Stop sharing" button
    stream.getVideoTracks()[0].onended = () => {
      cancelDebounce()
      if (sessionStateRef.current === 'recording') {
        finaliseClip((clip) => setClips((prev) => [...prev, clip]))
      }
      detachListenersRef.current?.()
      streamRef.current = null
      updateSessionState('idle')
    }

    detachListenersRef.current = attachListeners()
    updateSessionState('monitoring')
  }, [selectedQuality, attachListeners, cancelDebounce, finaliseClip])

  const endSession = useCallback(() => {
    cancelDebounce()

    if (sessionStateRef.current === 'recording') {
      finaliseClip((clip) => setClips((prev) => [...prev, clip]))
    }

    detachListenersRef.current?.()
    detachListenersRef.current = null

    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null

    updateSessionState('idle')
  }, [cancelDebounce, finaliseClip])

  const removeClip = useCallback((id: string) => {
    setClips((prev) => {
      const clip = prev.find((c) => c.id === id)
      if (clip) URL.revokeObjectURL(clip.url)
      return prev.filter((c) => c.id !== id)
    })
  }, [])

  return {
    sessionState,
    clips,
    error,
    selectedQuality,
    setSelectedQuality,
    startSession,
    endSession,
    removeClip,
  }
}
