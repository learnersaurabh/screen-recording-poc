import './index.css'
import { useScreenRecorder } from './hooks/useScreenRecorder'
import { RecordingControls } from './components/RecordingControls'
import { RecordingsList } from './components/RecordingsList'
import { UnsupportedBanner, isScreenCaptureSupported } from './components/UnsupportedBanner'

function App() {
  const {
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
  } = useScreenRecorder()

  return (
    <div className="app">
      <header className="app-header">
        <h1>Screen Recorder</h1>
        <p>Capture your screen and download recordings locally</p>
      </header>

      {isScreenCaptureSupported() ? (
        <>
          <RecordingControls
            isRecording={isRecording}
            keepRecordingOnTabSwitch={keepRecordingOnTabSwitch}
            selectedQuality={selectedQuality}
            error={error}
            onStart={startRecording}
            onStop={stopRecording}
            onToggleKeepRecording={setKeepRecordingOnTabSwitch}
            onQualityChange={setSelectedQuality}
          />
          <RecordingsList recordings={recordings} onRemove={removeRecording} />
        </>
      ) : (
        <UnsupportedBanner />
      )}
    </div>
  )
}

export default App
