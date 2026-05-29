export function isScreenCaptureSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)
}

export function UnsupportedBanner() {
  return (
    <div className="unsupported-banner">
      <div className="unsupported-icon">📵</div>
      <h2>Screen Recording Not Supported</h2>
      <p>
        Your browser or device does not support screen capture.
      </p>
      <p className="unsupported-hint">
        Please use <strong>Chrome</strong>, <strong>Firefox</strong>, or{' '}
        <strong>Safari on macOS</strong> on a desktop device.
        <br />
        iOS Safari does not support screen recording from the browser.
      </p>
    </div>
  )
}
