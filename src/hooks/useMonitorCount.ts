import { useEffect, useState } from 'react'

export interface MonitorInfo {
  count: number | null    // exact count if getScreenDetails succeeded
  isMulti: boolean        // true if count > 1 OR screen.isExtended
  supported: boolean      // true if getScreenDetails is available + permitted
}

type ExtendedScreen = Screen & { isExtended?: boolean }
type ScreenDetailsWindow = Window & { getScreenDetails?: () => Promise<{ screens: unknown[] }> }

function readIsExtended(): boolean {
  return (screen as ExtendedScreen).isExtended === true
}

export function useMonitorCount(): MonitorInfo {
  const [info, setInfo] = useState<MonitorInfo>(() => {
    const isExtended = readIsExtended()
    return { count: null, isMulti: isExtended, supported: false }
  })

  useEffect(() => {
    const w = window as ScreenDetailsWindow
    if (typeof w.getScreenDetails !== 'function') {
      // No API — rely solely on screen.isExtended
      setInfo({ count: null, isMulti: readIsExtended(), supported: false })
      return
    }

    // Call on window to preserve `this` binding
    w.getScreenDetails()
      .then((details) => {
        const count = details.screens.length
        setInfo({ count, isMulti: count > 1, supported: true })
      })
      .catch(() => {
        // Permission denied — fall back to isExtended
        setInfo({ count: null, isMulti: readIsExtended(), supported: false })
      })
  }, [])

  return info
}
