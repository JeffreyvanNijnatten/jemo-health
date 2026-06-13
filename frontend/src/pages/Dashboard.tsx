import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Settings2, Activity, Ruler, HeartPulse, Brain, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Profile, Measurement, GoalMap, UnitSystem } from '../lib/types'
import { api } from '../lib/api'
import { ProfileSwitcher } from '../components/ProfileSwitcher'
import { NamePromptModal } from '../components/NamePromptModal'
import { BodySilhouette } from '../components/BodySilhouette'
import { MetricCard } from '../components/MetricCard'
import { TrendChart } from '../components/TrendChart'
import { UploadZone } from '../components/UploadZone'
import { MeasurementDetail } from '../components/MeasurementDetail'
import { Settings } from './Settings'
import { bmiRange, bodyFatRange, muscleMassRange, visceralFatRange, metabolicAgeRange, waterPctRange, weightRange, restingCaloriesRange } from '../lib/health'
import { weightValue, weightUnit, formatHeight } from '../lib/units'
import { getStatusMessage } from '../lib/statusMessages'
import { bmiBandBoundaries, fatBandBoundaries, fatDistribution, muscleDistribution } from '../lib/references'

interface Props {
  unitSystem: UnitSystem
  onUnitChange: (u: UnitSystem) => void
  timezone: string
  onTimezoneChange: (tz: string) => void
  appName: string
  onAppNameChange: (name: string) => void
  formatDate: (iso: string) => string
  formatDateTime: (iso: string) => string
}

const ACTIVITY_LABEL: Record<number, string> = {
  1: 'Low activity', 2: 'Standard', 3: 'Active', 4: 'Very active', 5: 'Athletic',
}

const BODY_TYPE_LABEL: Record<number, string> = {
  0: 'Standard', 2: 'Athlete',
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getAge(dob: string | null): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--
  return age
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-xl font-medium text-[#222] mb-5">{children}</h2>
  )
}

export function Dashboard({ unitSystem, onUnitChange, timezone, onTimezoneChange, appName, onAppNameChange, formatDate, formatDateTime }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeId, setActiveId] = useState<number | null>(() => {
    const saved = localStorage.getItem('jemo_active_profile')
    return saved ? parseInt(saved, 10) : null
  })
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [goals, setGoals] = useState<GoalMap>({})
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null)
  const [unnamedProfile, setUnnamedProfile] = useState<Profile | null>(null)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [compositionView, setCompositionView] = useState<'fat' | 'muscle'>('fat')
  const [displayedIndex, setDisplayedIndex] = useState<number>(-1)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [noteValue, setNoteValue] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const profileScrollRef = useRef<HTMLDivElement>(null)
  const [profileFade, setProfileFade] = useState({ left: false, right: false })

  const updateProfileFade = () => {
    const el = profileScrollRef.current
    if (!el) return
    setProfileFade({
      left: el.scrollLeft > 1,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 1,
    })
  }

  const activeProfile = profiles.find(p => p.slot_id === activeId) ?? null
  const sorted = [...measurements].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null
  const displayedIdx = displayedIndex === -1 ? sorted.length - 1 : Math.min(displayedIndex, sorted.length - 1)
  const displayed = sorted[displayedIdx] ?? null
  const isLatest = displayedIdx === sorted.length - 1
  const prev = displayedIdx > 0 ? sorted[displayedIdx - 1] : null

  const measurementDateMap = (() => {
    const map = new Map<string, number>()
    sorted.forEach((m, i) => {
      const d = new Date(m.measured_at)
      map.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, i)
    })
    return map
  })()
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const calFirstDayOffset = (() => { const d = new Date(calYear, calMonth, 1).getDay(); return d === 0 ? 6 : d - 1 })()
  const calMonthLabel = new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const overallTrend = (() => {
    const a = latest
    const b = sorted.length >= 2 ? sorted[sorted.length - 2] : null
    if (!a || !b) return null
    const deltas: number[] = []
    if (a.fat_total_pct != null && b.fat_total_pct != null && b.fat_total_pct > 0)
      deltas.push((b.fat_total_pct - a.fat_total_pct) / b.fat_total_pct * 100)
    if (a.visceral_fat != null && b.visceral_fat != null && b.visceral_fat > 0)
      deltas.push((b.visceral_fat - a.visceral_fat) / b.visceral_fat * 100)
    if (a.muscle_total_kg != null && b.muscle_total_kg != null && b.muscle_total_kg > 0)
      deltas.push((a.muscle_total_kg - b.muscle_total_kg) / b.muscle_total_kg * 100)
    if (deltas.length === 0) return null
    return deltas.reduce((s, v) => s + v, 0) / deltas.length
  })()

  const bmiBands = (() => {
    const { normal, overweight } = bmiBandBoundaries(activeProfile?.ethnicity ?? null)
    return [
      { y1: 0,          y2: 18.5,       fill: '#c8e4f8' },
      { y1: 18.5,       y2: normal,     fill: '#d8f0c0' },
      { y1: normal,     y2: overweight, fill: '#fde8b0' },
      { y1: overweight, y2: 60,         fill: '#fad0c4' },
    ]
  })()

  const metabolicAgeBands = latest?.age != null ? (() => {
    const age = latest.age!
    return [
      { y1: 0,       y2: age - 5, fill: '#c0f0e0' },
      { y1: age - 5, y2: age,     fill: '#d8f0c0' },
      { y1: age,     y2: age + 5, fill: '#fde8b0' },
      { y1: age + 5, y2: 120,     fill: '#fad0c4' },
    ]
  })() : undefined

  const fatBands = (() => {
    const { excellent, good, average } = fatBandBoundaries(
      activeProfile?.gender ?? null,
      latest?.age ?? null,
      activeProfile?.ethnicity ?? null
    )
    return [
      { y1: 0,         y2: excellent, fill: '#c0f0e0' },
      { y1: excellent, y2: good,      fill: '#d8f0c0' },
      { y1: good,      y2: average,   fill: '#fde8b0' },
      { y1: average,   y2: 60,        fill: '#fad0c4' },
    ]
  })()

  const fatDist = displayed ? fatDistribution(
    displayed.fat_trunk_pct,
    displayed.fat_right_leg_pct,
    displayed.fat_left_leg_pct,
    activeProfile?.gender ?? null
  ) : null

  const muscleDist = displayed ? muscleDistribution(
    displayed.muscle_trunk_kg,
    displayed.muscle_right_arm_kg,
    displayed.muscle_left_arm_kg,
    displayed.muscle_right_leg_kg,
    displayed.muscle_left_leg_kg,
  ) : null

  const loadProfiles = useCallback(async () => {
    const ps = await api.profiles.list()
    setProfiles(ps)
    if (ps.length > 0) {
      setActiveId(prev => {
        if (prev && ps.find(p => p.slot_id === prev)) return prev
        const id = ps[0].slot_id
        localStorage.setItem('jemo_active_profile', String(id))
        return id
      })
    }
    const unnamed = ps.find(p => !p.name)
    if (unnamed) setUnnamedProfile(unnamed)
  }, [])

  const loadMeasurements = useCallback(async (id: number) => {
    const ms = await api.measurements.list(id)
    setMeasurements(ms)
  }, [])

  const loadGoals = useCallback(async (id: number) => {
    const gs = await api.goals.list(id)
    const map: GoalMap = {}
    gs.forEach(g => { map[g.metric] = g.target_value })
    setGoals(map)
  }, [])

  useEffect(() => { loadProfiles().finally(() => setLoading(false)) }, [])
  useEffect(() => { setTimeout(updateProfileFade, 0) }, [profiles])
  useEffect(() => { if (activeId) { loadMeasurements(activeId); loadGoals(activeId) } }, [activeId])
  useEffect(() => { setNoteValue(displayed?.note ?? '') }, [displayed?.id])

  const handleUploaded = () => { setDisplayedIndex(-1); loadProfiles(); if (activeId) loadMeasurements(activeId) }
  const handleNoteChanged = (updated: Measurement) => {
    setMeasurements(ms => ms.map(m => m.id === updated.id ? updated : m))
    setSelectedMeasurement(updated)
  }
  const saveNote = async () => {
    if (!displayed || !activeId) return
    setNoteSaving(true)
    try {
      const updated = await api.measurements.updateNote(activeId, displayed.id, noteValue || null)
      setMeasurements(ms => ms.map(m => m.id === updated.id ? updated : m))
    } finally {
      setNoteSaving(false)
    }
  }

  const age = getAge(activeProfile?.date_of_birth ?? null)
  const activityLabel = activeProfile?.activity_level ? ACTIVITY_LABEL[activeProfile.activity_level] : null
  const bodyTypeLabel = activeProfile?.body_type != null ? BODY_TYPE_LABEL[activeProfile.body_type] : null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex items-center justify-center">
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="font-serif text-[#9a9490]"
        >
          Loading your health data…
        </motion.p>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="font-serif text-4xl font-medium text-[#222] mb-3">
            {appName} <span className="gradient-text">Health</span>
          </h1>
          <p className="text-[#9a9490] mb-10">
            Nothing here yet — drop your TANITA folder to get started.
          </p>
          <UploadZone onUploaded={handleUploaded} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf6f1]">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#faf6f1]/90 backdrop-blur-md border-b border-[#ede7e0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <h1 className="font-serif text-base font-medium text-[#222] shrink-0">
            {appName} <span className="gradient-text">Health</span>
          </h1>
          <div className="relative flex-1 min-w-0">
            {profileFade.left && (
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10"
                style={{ background: 'linear-gradient(to right, #faf6f1, transparent)' }} />
            )}
            <div
              ref={profileScrollRef}
              onScroll={updateProfileFade}
              className="overflow-x-auto scrollbar-hide"
            >
              <ProfileSwitcher
                profiles={profiles}
                activeId={activeId!}
                onSwitch={id => {
                  setActiveId(id)
                  localStorage.setItem('jemo_active_profile', String(id))
                  setEditingProfile(null)
                  const p = profiles.find(pr => pr.slot_id === id)
                  if (p && !p.name) setUnnamedProfile(p)
                }}
                onEditProfile={p => setEditingProfile(p)}
              />
            </div>
            {profileFade.right && (
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10"
                style={{ background: 'linear-gradient(to left, #faf6f1, transparent)' }} />
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setShowSettings(true)} className="w-8 h-8 flex items-center justify-center rounded-full text-[#9a9490] hover:text-[#222] transition-colors" title="Settings">
              <Settings2 size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* Section 1 — Profile hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-[#f0ebe4] p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="flex-1">
              <p className="text-sm text-[#9a9490] mb-1">{getGreeting()},</p>
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="font-serif text-3xl font-medium text-[#222]">
                  {activeProfile?.name || 'friend'}
                </h2>
                {overallTrend != null && Math.abs(overallTrend) >= 0.05 && (
                  <span
                    className="text-sm font-medium"
                    style={{ color: overallTrend > 0 ? '#0d9488' : '#be5178' }}
                  >
                    {overallTrend > 0 ? '↑' : '↓'} {Math.abs(overallTrend).toFixed(1)}%
                  </span>
                )}
              </div>
              {latest && (
                <p className="text-[#574853] leading-relaxed max-w-md">
                  {getStatusMessage(measurements, activeProfile, goals)}
                </p>
              )}
            </div>

            {/* Profile stats */}
            <div className="flex flex-wrap sm:flex-col gap-3 sm:gap-2 shrink-0 sm:text-right">
              {age != null && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#9a9490]">Age</span>
                  <span className="font-medium text-[#222]">{age} yrs</span>
                </div>
              )}
              {activityLabel && (
                <div className="flex items-center gap-2 text-sm">
                  <Activity size={13} className="text-[#9a9490]" />
                  <span className="font-medium text-[#222]">{activityLabel}</span>
                </div>
              )}
              {bodyTypeLabel && (
                <div className="flex items-center gap-2 text-sm">
                  <Dumbbell size={13} className="text-[#9a9490]" />
                  <span className="font-medium text-[#222]">{bodyTypeLabel}</span>
                </div>
              )}
              {latest && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#9a9490]">Last measured</span>
                  <span className="font-medium text-[#222]">{formatDate(latest.measured_at)}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {latest ? (
          <>
            {/* Notes + Navigator row */}
            {displayed && (
              <div className="flex items-center gap-3">
                {/* Notes field */}
                <div className="flex w-2/4 items-center gap-2 min-w-0">
                  <textarea
                    value={noteValue}
                    onChange={e => setNoteValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNote() }}
                    placeholder="Add a note for this measurement…"
                    rows={1}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#e8e2db] bg-white text-[#222] placeholder:text-[#c8c0b8] outline-none focus:border-[#c094e4] resize-none leading-relaxed"
                  />
                  <button
                    onClick={saveNote}
                    disabled={noteSaving || noteValue === (displayed.note ?? '')}
                    className="px-3 py-1.5 text-xs rounded-lg bg-[#222] text-white disabled:opacity-30 transition-opacity shrink-0"
                  >
                    {noteSaving ? '…' : 'Save'}
                  </button>
                </div>
                {/* Measurement navigator */}
                {sorted.length > 1 && (
                  <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    <button
                      onClick={() => setDisplayedIndex(displayedIdx - 1)}
                      disabled={displayedIdx === 0}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-[#9a9490] hover:text-[#222] hover:bg-[#f0ebe4] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => {
                          if (!showCalendar) {
                            const d = new Date(displayed.measured_at)
                            setCalYear(d.getFullYear())
                            setCalMonth(d.getMonth())
                          }
                          setShowCalendar(v => !v)
                        }}
                        className="text-sm text-[#9a9490] font-mono tracking-wide hover:text-[#222] transition-colors px-2 py-1 rounded-lg hover:bg-[#f0ebe4]"
                      >
                        {formatDate(displayed.measured_at)}
                      </button>
                      {showCalendar && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
                          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-[#f0ebe4] rounded-2xl shadow-lg p-4 w-60">
                            <div className="flex items-center justify-between mb-3">
                              <button
                                onClick={() => {
                                  if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
                                  else setCalMonth(m => m - 1)
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-full text-[#9a9490] hover:text-[#222] hover:bg-[#f0ebe4] transition-all"
                              >
                                <ChevronLeft size={13} />
                              </button>
                              <span className="text-xs font-medium text-[#222]">{calMonthLabel}</span>
                              <button
                                onClick={() => {
                                  if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
                                  else setCalMonth(m => m + 1)
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-full text-[#9a9490] hover:text-[#222] hover:bg-[#f0ebe4] transition-all"
                              >
                                <ChevronRight size={13} />
                              </button>
                            </div>
                            <div className="grid grid-cols-7 mb-1">
                              {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
                                <div key={d} className="text-center text-[10px] text-[#c8c0b8] py-0.5">{d}</div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-y-0.5">
                              {Array.from({ length: calFirstDayOffset }, (_, i) => <div key={`b${i}`} />)}
                              {Array.from({ length: calDaysInMonth }, (_, i) => {
                                const day = i + 1
                                const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                const idx = measurementDateMap.get(dateKey)
                                const hasMeasurement = idx !== undefined
                                const isSelected = idx === displayedIdx
                                return (
                                  <button
                                    key={day}
                                    disabled={!hasMeasurement}
                                    onClick={() => {
                                      if (idx !== undefined) {
                                        setDisplayedIndex(idx >= sorted.length - 1 ? -1 : idx)
                                        setShowCalendar(false)
                                      }
                                    }}
                                    className={`h-7 w-full text-[11px] rounded-full flex items-center justify-center transition-all ${
                                      isSelected
                                        ? 'bg-[#222] text-white font-medium'
                                        : hasMeasurement
                                        ? 'bg-[#f0ebe4] text-[#222] hover:bg-[#e8e2db] font-medium cursor-pointer'
                                        : 'text-[#d8d0c8] cursor-default'
                                    }`}
                                  >
                                    {day}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setDisplayedIndex(displayedIdx + 1 >= sorted.length - 1 ? -1 : displayedIdx + 1)}
                      disabled={isLatest}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-[#9a9490] hover:text-[#222] hover:bg-[#f0ebe4] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Section 2 — Core vitals */}
            <section>
              <SectionTitle>Vitals</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <MetricCard
                  index={0}
                  label="Weight"
                  value={weightValue(displayed?.weight_kg ?? null, unitSystem)}
                  unit={weightUnit(unitSystem)}
                  decimals={1}
                  healthRange={displayed?.weight_kg != null && displayed?.height_cm != null
                    ? weightRange(displayed.weight_kg, displayed.height_cm, activeProfile?.ethnicity)
                    : null}
                  goal={goals.weight_kg != null ? weightValue(goals.weight_kg, unitSystem)! : undefined}
                  goalUnit={weightUnit(unitSystem)}
                  metric="weight_kg"
                  profileId={activeId!}
                  onGoalChanged={() => loadGoals(activeId!)}
                  delta={displayed?.weight_kg != null && prev?.weight_kg != null
                    ? weightValue(displayed.weight_kg, unitSystem)! - weightValue(prev.weight_kg, unitSystem)!
                    : null}
                  deltaGoodDirection="neutral"
                />
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.06 }}
                  className="bg-white rounded-2xl p-5 border border-[#f0ebe4] flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2">
                    <Ruler size={13} className="text-[#9a9490]" />
                    <span className="text-xs text-[#9a9490] font-medium">Height</span>
                  </div>
                  <p className="text-3xl font-medium text-[#222] tracking-tight">
                    {formatHeight(displayed?.height_cm ?? null, unitSystem)}
                  </p>
                </motion.div>
                <MetricCard
                  index={2}
                  label="Resting calories"
                  value={displayed?.resting_calories ?? null}
                  unit=" kcal"
                  decimals={0}
                  healthRange={displayed?.resting_calories != null
                    ? restingCaloriesRange(displayed.resting_calories, displayed.activity_level)
                    : null}
                  goal={goals.resting_calories}
                  goalUnit=" kcal"
                  metric="resting_calories"
                  profileId={activeId!}
                  onGoalChanged={() => loadGoals(activeId!)}
                  delta={displayed?.resting_calories != null && prev?.resting_calories != null
                    ? displayed.resting_calories - prev.resting_calories
                    : null}
                  deltaGoodDirection="neutral"
                />
                <MetricCard
                  index={3}
                  label="Water"
                  value={displayed?.water_pct ?? null}
                  unit="%"
                  decimals={1}
                  healthRange={displayed?.water_pct != null
                    ? waterPctRange(displayed.water_pct, activeProfile?.gender)
                    : null}
                  goal={goals.water_pct}
                  goalUnit="%"
                  metric="water_pct"
                  profileId={activeId!}
                  onGoalChanged={() => loadGoals(activeId!)}
                  delta={displayed?.water_pct != null && prev?.water_pct != null
                    ? displayed.water_pct - prev.water_pct
                    : null}
                  deltaGoodDirection="up"
                />
              </div>
              <TrendChart
                label="Weight over time"
                measurements={sorted}
                field="weight_kg"
                unit={weightUnit(unitSystem)}
                goal={goals.weight_kg}
                formatDate={formatDate}
                onPointClick={setSelectedMeasurement}
              />
            </section>

            {/* Section 3 — BMI + Metabolic age */}
            <section>
              <SectionTitle>Health scores</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* BMI card — larger with explanation */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="bg-white rounded-2xl p-5 border border-[#f0ebe4] flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HeartPulse size={13} className="text-[#9a9490]" />
                      <span className="text-xs text-[#9a9490] font-medium">BMI</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-medium text-[#222] tracking-tight">
                      {displayed?.bmi?.toFixed(1) ?? '—'}
                    </span>
                  </div>
                  {displayed?.bmi != null && prev?.bmi != null && Math.abs(displayed.bmi - prev.bmi) > 0.05 && (
                    <div className="flex items-center gap-1.5 -mt-1">
                      <span className="text-xs font-medium text-[#9a9490]">
                        {displayed.bmi - prev.bmi > 0 ? '↑' : '↓'} {Math.abs(displayed.bmi - prev.bmi).toFixed(1)}
                      </span>
                      <span className="text-xs text-[#c8c0b8]">since last</span>
                    </div>
                  )}
                  {displayed?.bmi && (
                    <>
                      {(() => { const r = bmiRange(displayed.bmi, activeProfile?.ethnicity); return (
                        <>
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium self-start"
                            style={{ backgroundColor: r.bgColor, color: r.textColor }}
                          >
                            {r.label}
                          </div>
                          <p className="text-xs text-[#9a9490] leading-relaxed">
                            {r.description}
                          </p>
                        </>
                      )})()}
                    </>
                  )}
                </motion.div>

                <MetricCard
                  index={1}
                  label="Metabolic age"
                  value={displayed?.metabolic_age ?? null}
                  unit=" yrs"
                  decimals={0}
                  healthRange={displayed?.metabolic_age != null && displayed?.age != null
                    ? metabolicAgeRange(displayed.metabolic_age, displayed.age)
                    : null}
                  metric="metabolic_age"
                  profileId={activeId!}
                  onGoalChanged={() => loadGoals(activeId!)}
                  delta={displayed?.metabolic_age != null && prev?.metabolic_age != null
                    ? displayed.metabolic_age - prev.metabolic_age
                    : null}
                  deltaGoodDirection="down"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TrendChart
                  label="BMI"
                  measurements={sorted}
                  field="bmi"
                  unit=""
                  color="#5b9cf6"
                  bands={bmiBands}
                  formatDate={formatDate}
                  onPointClick={setSelectedMeasurement}
                />
                <TrendChart
                  label="Metabolic age"
                  measurements={sorted}
                  field="metabolic_age"
                  unit=" yrs"
                  color="#ffb760"
                  bands={metabolicAgeBands}
                  formatDate={formatDate}
                  onPointClick={setSelectedMeasurement}
                />
              </div>
            </section>

            {/* Section 4 — Body composition with silhouette */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-xl font-medium text-[#222]">Body composition</h2>
                <div className="flex gap-1 bg-[#f0ebe4] rounded-full p-1">
                  {(['fat', 'muscle'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setCompositionView(v)}
                      className={`px-5 py-1.5 text-xs font-medium rounded-full transition-all ${
                        compositionView === v
                          ? 'bg-white text-[#222] shadow-sm'
                          : 'text-[#9a9490] hover:text-[#222]'
                      }`}
                    >
                      {v === 'fat' ? 'Body fat' : 'Muscle'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-[#f0ebe4] p-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
                  <div className="grid grid-cols-2 gap-4">
                    {compositionView === 'fat' ? (
                      <>
                        <MetricCard
                          label="Total body fat"
                          value={displayed?.fat_total_pct ?? null}
                          unit="%"
                          decimals={1}
                          goal={goals.fat_total_pct}
                          goalUnit="%"
                          healthRange={displayed?.fat_total_pct != null ? bodyFatRange(displayed.fat_total_pct, activeProfile?.gender ?? null, displayed.age, activeProfile?.ethnicity, fatDist) : null}
                          metric="fat_total_pct"
                          profileId={activeId!}
                          onGoalChanged={() => loadGoals(activeId!)}
                          delta={displayed?.fat_total_pct != null && prev?.fat_total_pct != null
                            ? displayed.fat_total_pct - prev.fat_total_pct
                            : null}
                          deltaGoodDirection="down"
                        />
                        <MetricCard
                          label="Visceral fat"
                          value={displayed?.visceral_fat ?? null}
                          prefix="Level"
                          unit=""
                          decimals={0}
                          goal={goals.visceral_fat}
                          healthRange={displayed?.visceral_fat != null ? visceralFatRange(displayed.visceral_fat) : null}
                          metric="visceral_fat"
                          profileId={activeId!}
                          onGoalChanged={() => loadGoals(activeId!)}
                          delta={displayed?.visceral_fat != null && prev?.visceral_fat != null
                            ? displayed.visceral_fat - prev.visceral_fat
                            : null}
                          deltaGoodDirection="down"
                        />
                        <MetricCard
                          label="Trunk fat"
                          value={displayed?.fat_trunk_pct ?? null}
                          unit="%"
                          decimals={1}
                          metric="fat_trunk_pct"
                          profileId={activeId!}
                          onGoalChanged={() => loadGoals(activeId!)}
                          delta={displayed?.fat_trunk_pct != null && prev?.fat_trunk_pct != null
                            ? displayed.fat_trunk_pct - prev.fat_trunk_pct
                            : null}
                          deltaGoodDirection="down"
                        />
                        <MetricCard
                          label="Bone mass"
                          value={weightValue(displayed?.bone_kg ?? null, unitSystem)}
                          unit={weightUnit(unitSystem)}
                          decimals={2}
                          metric="bone_kg"
                          profileId={activeId!}
                          onGoalChanged={() => loadGoals(activeId!)}
                        />
                      </>
                    ) : (
                      <>
                        <MetricCard
                          label="Total muscle"
                          value={weightValue(displayed?.muscle_total_kg ?? null, unitSystem)}
                          unit={weightUnit(unitSystem)}
                          decimals={1}
                          goal={goals.muscle_total_kg != null ? weightValue(goals.muscle_total_kg, unitSystem)! : undefined}
                          goalUnit={weightUnit(unitSystem)}
                          healthRange={displayed?.muscle_total_kg != null ? muscleMassRange(displayed.muscle_total_kg, activeProfile?.height_cm ?? null, activeProfile?.gender ?? null, displayed.age, muscleDist) : null}
                          metric="muscle_total_kg"
                          profileId={activeId!}
                          onGoalChanged={() => loadGoals(activeId!)}
                          delta={displayed?.muscle_total_kg != null && prev?.muscle_total_kg != null
                            ? weightValue(displayed.muscle_total_kg, unitSystem)! - weightValue(prev.muscle_total_kg, unitSystem)!
                            : null}
                          deltaGoodDirection="up"
                        />
                        <MetricCard
                          label="Trunk muscle"
                          value={weightValue(displayed?.muscle_trunk_kg ?? null, unitSystem)}
                          unit={weightUnit(unitSystem)}
                          decimals={1}
                          metric="muscle_trunk_kg"
                          profileId={activeId!}
                          onGoalChanged={() => loadGoals(activeId!)}
                          delta={displayed?.muscle_trunk_kg != null && prev?.muscle_trunk_kg != null
                            ? weightValue(displayed.muscle_trunk_kg, unitSystem)! - weightValue(prev.muscle_trunk_kg, unitSystem)!
                            : null}
                          deltaGoodDirection="up"
                        />
                        <div />
                        <MetricCard
                          label="Bone mass"
                          value={weightValue(displayed?.bone_kg ?? null, unitSystem)}
                          unit={weightUnit(unitSystem)}
                          decimals={2}
                          metric="bone_kg"
                          profileId={activeId!}
                          onGoalChanged={() => loadGoals(activeId!)}
                        />
                      </>
                    )}
                  </div>
                  <BodySilhouette measurement={displayed} profile={activeProfile} view={compositionView} onViewChange={setCompositionView} />
                </div>
                <div className="mt-6">
                  {compositionView === 'fat' ? (
                    <TrendChart
                      label="Body fat %"
                      measurements={sorted}
                      field="fat_total_pct"
                      unit="%"
                      goal={goals.fat_total_pct}
                      color="#f7bbe6"
                      bands={fatBands}
                      formatDate={formatDate}
                      onPointClick={setSelectedMeasurement}
                    />
                  ) : (
                    <TrendChart
                      label="Muscle mass"
                      measurements={sorted}
                      field="muscle_total_kg"
                      unit={weightUnit(unitSystem)}
                      goal={goals.muscle_total_kg}
                      color="#f7bbe6"
                      formatDate={formatDate}
                      onPointClick={setSelectedMeasurement}
                    />
                  )}
                </div>
              </div>
            </section>

            {/* Section 5 — Upload zone */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Brain size={15} className="text-[#9a9490]" />
                <p className="text-sm text-[#9a9490]">Add more data</p>
              </div>
              <UploadZone onUploaded={handleUploaded} />
            </section>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="font-serif text-lg text-[#9a9490] mb-8">
              No measurements yet for this profile.
            </p>
            <UploadZone onUploaded={handleUploaded} />
          </div>
        )}

      </main>

      <MeasurementDetail
        key={selectedMeasurement?.id ?? 'none'}
        measurement={selectedMeasurement}
        profileId={activeId!}
        profile={activeProfile}
        onClose={() => setSelectedMeasurement(null)}
        onNoteChanged={handleNoteChanged}
        formatDateTime={formatDateTime}
        unitSystem={unitSystem}
      />

      {(unnamedProfile || editingProfile) && (
        <NamePromptModal
          profile={editingProfile ?? unnamedProfile!}
          onNamed={updated => {
            const updatedProfiles = profiles.map(p => p.slot_id === updated.slot_id ? updated : p)
            setProfiles(updatedProfiles)
            if (unnamedProfile?.slot_id === updated.slot_id) {
              const nextUnnamed = updatedProfiles.find(p => !p.name)
              setUnnamedProfile(nextUnnamed ?? null)
            }
            setEditingProfile(null)
          }}
          onClose={editingProfile ? () => setEditingProfile(null) : undefined}
        />
      )}

      {showSettings && (
        <Settings
          unitSystem={unitSystem}
          onUnitChange={onUnitChange}
          timezone={timezone}
          onTimezoneChange={onTimezoneChange}
          appName={appName}
          onAppNameChange={onAppNameChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
