import { useEffect, useState } from 'react'

export interface PerformanceMetrics {
  fps: number
  heapUsedMB: number
  heapLimitMB: number
  heapPct: number
  heapSupported: boolean
}

export function usePerformanceMetrics(): PerformanceMetrics {
  const [fps, setFps] = useState(0)
  const [heapUsedMB, setHeapUsedMB] = useState(0)
  const [heapLimitMB, setHeapLimitMB] = useState(0)
  const [heapPct, setHeapPct] = useState(0)

  const heapSupported = 'memory' in performance

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let rafId: number

    const tick = () => {
      frameCount++
      const now = performance.now()
      const elapsed = now - lastTime
      if (elapsed >= 1000) {
        setFps(Math.round((frameCount * 1000) / elapsed))
        frameCount = 0
        lastTime = now
      }
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  useEffect(() => {
    if (!heapSupported) return

    const update = () => {
      const mem = (performance as Performance & { memory: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory
      const used = mem.usedJSHeapSize / (1024 * 1024)
      const limit = mem.jsHeapSizeLimit / (1024 * 1024)
      setHeapUsedMB(Math.round(used))
      setHeapLimitMB(Math.round(limit))
      setHeapPct(Math.round((used / limit) * 100))
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [heapSupported])

  return { fps, heapUsedMB, heapLimitMB, heapPct, heapSupported }
}
