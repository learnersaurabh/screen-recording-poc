import './index.css'
import { useRef, useState } from 'react'
import { useProctoringRecorder } from './hooks/useProctoringRecorder'
import { usePerformanceMetrics } from './hooks/usePerformanceMetrics'
import { useMonitorCount } from './hooks/useMonitorCount'
import { RecordingControls } from './components/RecordingControls'
import { RecordingsList } from './components/RecordingsList'
import { UnsupportedBanner, isScreenCaptureSupported } from './components/UnsupportedBanner'
import { PerformancePanel } from './components/PerformancePanel'

function App() {
  const { fps, heapUsedMB, heapLimitMB, heapPct, heapSupported } = usePerformanceMetrics()

  const perfMetricsRef = useRef({ fps: 0, heapPct: 0 })
  perfMetricsRef.current = { fps, heapPct }

  const {
    sessionState,
    clips,
    error,
    selectedQuality,
    setSelectedQuality,
    startSession,
    endSession,
    removeClip,
    encodeRateKBps,
  } = useProctoringRecorder(perfMetricsRef)

  const { count: monitorCount, isMulti: isMultiMonitor } = useMonitorCount()
  const [multiMonitorAcknowledged, setMultiMonitorAcknowledged] = useState(false)

  return (
    <div className="app">
      <header className="app-header">
        <h1>Proctoring Recorder</h1>
        <p>Records your screen only when you leave this application</p>
      </header>

      {isScreenCaptureSupported() ? (
        <>
          <RecordingControls
            sessionState={sessionState}
            selectedQuality={selectedQuality}
            error={error}
            monitorCount={monitorCount}
            isMultiMonitor={isMultiMonitor}
            multiMonitorAcknowledged={multiMonitorAcknowledged}
            onStart={startSession}
            onEnd={endSession}
            onQualityChange={setSelectedQuality}
            onAcknowledgeChange={setMultiMonitorAcknowledged}
          />
          <PerformancePanel
            sessionState={sessionState}
            encodeRateKBps={encodeRateKBps}
            fps={fps}
            heapUsedMB={heapUsedMB}
            heapLimitMB={heapLimitMB}
            heapPct={heapPct}
            heapSupported={heapSupported}
          />
          <RecordingsList recordings={clips} onRemove={removeClip} />
        </>
      ) : (
        <UnsupportedBanner />
      )}
    </div>
  )
}

export default App
