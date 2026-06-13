import { useState, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea,
} from 'recharts'
import type { Measurement } from '../lib/types'

type Range = '30d' | '90d' | '180d' | 'all'

interface Band {
  y1: number
  y2: number
  fill: string
}

interface Props {
  label: string
  measurements: Measurement[]
  field: keyof Measurement
  unit: string
  goal?: number | null
  color?: string
  bands?: Band[]
  formatDate: (iso: string) => string
  onPointClick?: (m: Measurement) => void
}

const RANGES: { label: string; value: Range; days?: number }[] = [
  { label: '30d', value: '30d', days: 30 },
  { label: '3mo', value: '90d', days: 90 },
  { label: '6mo', value: '180d', days: 180 },
  { label: 'All', value: 'all' },
]

function filterByRange(data: Measurement[], range: Range): Measurement[] {
  if (range === 'all') return data
  const cutoff = new Date()
  const days = RANGES.find(r => r.value === range)?.days ?? 30
  cutoff.setDate(cutoff.getDate() - days)
  return data.filter(m => new Date(m.measured_at) >= cutoff)
}

export function TrendChart({ label, measurements, field, unit, goal, color = '#c094e4', bands, formatDate, onPointClick }: Props) {
  const [range, setRange] = useState<Range>('all')
  const activeRef = useRef<Measurement | null>(null)

  const filtered = filterByRange(measurements, range)
  const data = filtered
    .map(m => ({
      date: formatDate(m.measured_at),
      value: m[field] as number | null,
      raw: m,
    }))
    .filter(d => d.value != null)

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5">
        <p className="text-xs font-mono uppercase tracking-widest text-[#7a7876] mb-4">{label}</p>
        <div className="h-32 flex items-center justify-center text-sm text-[#7a7876]">
          No data yet
        </div>
      </div>
    )
  }

  const values = data.map(d => d.value as number)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const padding = (max - min) * 0.2 || 1
  const yMin = min - padding
  const yMax = max + padding

  const clippedBands = bands
    ?.map(b => ({ ...b, y1: Math.max(b.y1, yMin), y2: Math.min(b.y2, yMax) }))
    .filter(b => b.y1 < b.y2)

  return (
    <div className="bg-white rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-mono uppercase tracking-widest text-[#7a7876]">{label}</p>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-2.5 py-1 text-xs rounded-full transition-all ${
                range === r.value
                  ? 'bg-[#222] text-white font-medium'
                  : 'text-[#7a7876] hover:text-[#222]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          onMouseLeave={() => { activeRef.current = null }}
          onClick={() => {
            if (activeRef.current && onPointClick) onPointClick(activeRef.current)
          }}
          style={{ cursor: onPointClick ? 'pointer' : 'default' }}
        >
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#7a7876', fontFamily: 'JetBrains Mono, monospace' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 10, fill: '#7a7876', fontFamily: 'JetBrains Mono, monospace' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${Number(v).toFixed(1)}`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg, #fff)',
              border: '1px solid #e5e5e5',
              borderRadius: 12,
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
            }}
            formatter={(value: unknown) => [`${Number(value).toFixed(2)} ${unit}`, label]}
            labelStyle={{ color: '#7a7876', marginBottom: 2 }}
          />
          {clippedBands?.map((b, i) => (
            <ReferenceArea key={i} y1={b.y1} y2={b.y2} fill={b.fill} fillOpacity={0.5} stroke="none" />
          ))}
          {goal != null && (
            <ReferenceLine
              y={goal}
              stroke="#ffb760"
              strokeDasharray="4 4"
              label={{ value: 'Goal', position: 'right', fontSize: 10, fill: '#ffb760', fontFamily: 'JetBrains Mono, monospace' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={(props: any) => {
              const m: Measurement | undefined = props.payload?.raw
              const hasNote = typeof m?.note === 'string' && m.note.length > 0
              if (hasNote) {
                return (
                  <circle
                    key={`dot-${props.index}`}
                    cx={props.cx} cy={props.cy} r={6}
                    fill="white" stroke={color} strokeWidth={2.5}
                  />
                )
              }
              return (
                <circle
                  key={`dot-${props.index}`}
                  cx={props.cx} cy={props.cy} r={3}
                  fill={color} stroke={color}
                />
              )
            }}
            activeDot={(props: any) => {
              activeRef.current = props.payload?.raw ?? null
              return (
                <circle
                  cx={props.cx} cy={props.cy} r={7}
                  fill={color} stroke="#fff" strokeWidth={2.5}
                  style={{ cursor: onPointClick ? 'pointer' : 'default' }}
                />
              )
            }}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
