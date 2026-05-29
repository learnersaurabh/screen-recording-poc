import './index.css'
import { useProctoringRecorder } from './hooks/useProctoringRecorder'
import { RecordingControls } from './components/RecordingControls'
import { RecordingsList } from './components/RecordingsList'
import { UnsupportedBanner, isScreenCaptureSupported } from './components/UnsupportedBanner'

function App() {
  const {
    sessionState,
    clips,
    error,
    selectedQuality,
    setSelectedQuality,
    startSession,
    endSession,
    removeClip,
  } = useProctoringRecorder()

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
            onStart={startSession}
            onEnd={endSession}
            onQualityChange={setSelectedQuality}
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
