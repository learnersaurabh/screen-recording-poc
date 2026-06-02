import { useRef } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import type { PerfSample } from '../hooks/useProctoringRecorder'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

interface Props {
  samples: PerfSample[]
  startedAt: Date
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function fileTimestamp(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}-${pad(d.getMinutes())}`
}

export function PerformanceGraph({ samples, startedAt }: Props) {
  const chartRef = useRef<ChartJS<'line'>>(null)

  if (samples.length === 0) return null

  const labels = samples.map((s) => `${s.t}s`)

  const data = {
    labels,
    datasets: [
      {
        label: 'FPS',
        data: samples.map((s) => s.fps),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        yAxisID: 'y',
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: 'Heap %',
        data: samples.map((s) => s.heapPct),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.08)',
        yAxisID: 'y',
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: 'Encode KB/s',
        data: samples.map((s) => s.encodeKBps),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.08)',
        yAxisID: 'y1',
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    interaction: { mode: 'index' as const, intersect: false },
    scales: {
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        min: 0,
        max: 100,
        title: { display: true, text: 'FPS / Heap %' },
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        min: 0,
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'KB/s' },
      },
    },
    plugins: {
      legend: { position: 'top' as const },
    },
  }

  const ts = fileTimestamp(startedAt)

  const downloadPNG = () => {
    const url = chartRef.current?.toBase64Image()
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `perf-${ts}.png`
    a.click()
  }

  const downloadCSV = () => {
    const header = 't_sec,fps,heap_pct,encode_kbps'
    const rows = samples.map((s) => `${s.t},${s.fps},${s.heapPct},${s.encodeKBps.toFixed(1)}`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `perf-${ts}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="perf-graph">
      <div className="perf-graph-header">
        <span className="perf-graph-title">Performance During Recording</span>
        <div className="perf-graph-actions">
          <button className="btn btn-sm" onClick={downloadPNG}>PNG</button>
          <button className="btn btn-sm" onClick={downloadCSV}>CSV</button>
        </div>
      </div>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  )
}
