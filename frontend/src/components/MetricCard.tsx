import { useState, useEffect, useRef } from 'react'
import { motion, animate } from 'framer-motion'
import { Target, X, Check } from 'lucide-react'
import type { HealthRange } from '../lib/health'
import { api } from '../lib/api'

interface Props {
  label: string
  value: number | null
  unit?: string
  decimals?: number
  goal?: number | null
  goalUnit?: string
  healthRange?: HealthRange | null
  metric?: string
  profileId?: number
  onGoalChanged?: () => void
  size?: 'default' | 'large'
  index?: number
  prefix?: string
  delta?: number | null
  deltaUnit?: string
  deltaGoodDirection?: 'up' | 'down' | 'neutral'
}

function AnimatedNumber({ value, decimals = 1 }: { value: number; decimals: number }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    const from = prevRef.current
    prevRef.current = value
    const controls = animate(from, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: v => setDisplay(v),
    })
    return controls.stop
  }, [value])

  return <>{display.toFixed(decimals)}</>
}

export function MetricCard({ label, value, unit, decimals = 1, goal, goalUnit, healthRange, metric, profileId, onGoalChanged, size = 'default', index = 0, prefix, delta, deltaUnit, deltaGoodDirection }: Props) {
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState(goal?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  const saveGoal = async () => {
    if (!metric || !profileId) return
    setSaving(true)
    try {
      const num = parseFloat(goalInput)
      if (!isNaN(num)) {
        await api.goals.upsert(profileId, metric, num)
      } else if (goalInput === '') {
        await api.goals.delete(profileId, metric)
      }
      onGoalChanged?.()
      setEditingGoal(false)
    } finally {
      setSaving(false)
    }
  }

  const hasGoal = goal != null && value != null
  const diff = hasGoal ? value - goal : 0
  const progress = hasGoal ? Math.min((value / goal) * 100, 100) : 0
  const atGoal = hasGoal && Math.abs(diff) <= 0.05 * goal
  const deltaColor =
    delta == null || delta === 0 || !deltaGoodDirection || deltaGoodDirection === 'neutral'
      ? '#9a9490'
      : (deltaGoodDirection === 'down' && delta < 0) || (deltaGoodDirection === 'up' && delta > 0)
        ? '#0d9488'
        : '#be5178'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="bg-white rounded-2xl p-5 border border-[#f0ebe4] flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-[#9a9490] font-medium leading-tight">{label}</span>
        {metric && profileId && (
          <button
            onClick={() => { setEditingGoal(e => !e); setGoalInput(goal?.toString() ?? '') }}
            className="text-[#c8c0b8] hover:text-[#c094e4] transition-colors shrink-0 mt-0.5"
            title="Set goal"
          >
            <Target size={14} />
          </button>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        {value != null ? (
          <>
            <span className={`font-medium text-[#222] tracking-tight ${size === 'large' ? 'text-4xl' : 'text-3xl'}`}>
              {prefix && <>{prefix} </>}
              <AnimatedNumber value={value} decimals={decimals} />
            </span>
            {unit && <span className="text-sm text-[#9a9490]">{unit}</span>}
          </>
        ) : (
          <span className="text-3xl text-[#d8d0c8]">—</span>
        )}
      </div>

      {delta != null && delta !== 0 && (
        <div className="flex items-center gap-1.5 -mt-1">
          <span className="text-xs font-medium" style={{ color: deltaColor }}>
            {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(decimals)}{deltaUnit !== undefined ? deltaUnit : unit}
          </span>
          <span className="text-xs text-[#c8c0b8]">since last</span>
        </div>
      )}

      {healthRange && (
        <>
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium self-start"
            style={{ backgroundColor: healthRange.bgColor, color: healthRange.textColor }}
          >
            {healthRange.label}
          </div>
          {healthRange.description && (
            <p className="text-xs text-[#9a9490] leading-relaxed -mt-1">
              {healthRange.description}
            </p>
          )}
        </>
      )}

      {hasGoal && (
        <div className="space-y-1.5">
          <div className="h-1.5 bg-[#f0ebe4] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: atGoal ? '#a8e6cf' : '#c094e4' }}
            />
          </div>
          <p className="text-xs text-[#9a9490]">
            {atGoal
              ? `Right on goal — ${goal}${goalUnit || unit}`
              : diff < 0
                ? `${Math.abs(diff).toFixed(decimals)}${goalUnit || unit} away from your goal of ${goal}${goalUnit || unit}`
                : `${diff.toFixed(decimals)}${goalUnit || unit} above your goal of ${goal}${goalUnit || unit}`
            }
          </p>
        </div>
      )}

      {editingGoal && (
        <div className="flex gap-2 items-center pt-2 border-t border-[#f0ebe4]">
          <input
            autoFocus
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveGoal(); if (e.key === 'Escape') setEditingGoal(false) }}
            placeholder="Target…"
            className="flex-1 min-w-0 px-3 py-1.5 text-xs rounded-lg border border-[#e8e2db] bg-[#faf6f1] text-[#222] outline-none focus:border-[#c094e4]"
          />
          <button onClick={saveGoal} disabled={saving} className="p-1.5 rounded-lg bg-[#222] text-white disabled:opacity-40">
            <Check size={12} />
          </button>
          <button onClick={() => setEditingGoal(false)} className="p-1.5 text-[#9a9490] hover:text-[#222]">
            <X size={12} />
          </button>
        </div>
      )}
    </motion.div>
  )
}
