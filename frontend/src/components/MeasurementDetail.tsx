import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'
import type { Measurement, Profile, UnitSystem } from '../lib/types'
import { formatWeight } from '../lib/units'
import { api } from '../lib/api'
import {
  bmiRange, bodyFatRange, muscleMassRange, visceralFatRange,
  metabolicAgeRange, waterPctRange, weightRange, restingCaloriesRange,
} from '../lib/health'
import { fatCategory } from '../lib/references'

const FAT_CAT_COLOR: Record<string, string> = {
  excellent: '#c0f0e0',
  good:      '#d8f0c0',
  average:   '#fde8b0',
  high:      '#fad0c4',
}

function fatSegBgColor(pct: number | null, gender: number | null, age: number | null, ethnicity: string | null): string | undefined {
  if (pct == null) return undefined
  const cat = fatCategory(pct, gender, age, ethnicity)
  return cat ? FAT_CAT_COLOR[cat] : undefined
}

function muscleSegBgColor(segKg: number | null, weightKg: number | null): string | undefined {
  if (segKg == null || weightKg == null || weightKg === 0) return undefined
  const t = Math.min((segKg / weightKg) * 100 / 20, 1)
  const r = Math.round(0xfd + (0xd0 - 0xfd) * t)
  const g = Math.round(0xe4 + (0x48 - 0xe4) * t)
  const b = Math.round(0xf0 + (0x88 - 0xf0) * t)
  return `rgb(${r},${g},${b})`
}

interface Props {
  measurement: Measurement | null
  profileId: number
  profile?: Profile | null
  onClose: () => void
  onNoteChanged: (m: Measurement) => void
  formatDateTime: (iso: string) => string
  unitSystem: UnitSystem
}

export function MeasurementDetail({ measurement: m, profileId, profile, onClose, onNoteChanged, formatDateTime, unitSystem }: Props) {
  const [note, setNote] = useState(m?.note ?? '')
  const [saving, setSaving] = useState(false)

  const saveNote = async () => {
    if (!m) return
    setSaving(true)
    try {
      const updated = await api.measurements.updateNote(profileId, m.id, note || null)
      onNoteChanged(updated)
    } finally {
      setSaving(false)
    }
  }

  const metrics: Array<{ label: string; val: string | undefined; bgColor?: string }> = m ? [
    // Vitals
    {
      label: 'Weight',
      val: formatWeight(m.weight_kg, unitSystem),
      bgColor: m.weight_kg != null && m.height_cm != null
        ? weightRange(m.weight_kg, m.height_cm, profile?.ethnicity).bgColor : undefined,
    },
    {
      label: 'Resting cal.',
      val: m.resting_calories != null ? `${m.resting_calories} kcal` : undefined,
      bgColor: m.resting_calories != null
        ? restingCaloriesRange(m.resting_calories, m.activity_level).bgColor : undefined,
    },
    {
      label: 'Water',
      val: m.water_pct != null ? `${m.water_pct.toFixed(1)}%` : undefined,
      bgColor: m.water_pct != null
        ? waterPctRange(m.water_pct, profile?.gender).bgColor : undefined,
    },
    // Health scores
    {
      label: 'BMI',
      val: m.bmi?.toFixed(1),
      bgColor: m.bmi != null ? bmiRange(m.bmi, profile?.ethnicity).bgColor : undefined,
    },
    {
      label: 'Metabolic age',
      val: m.metabolic_age != null ? `${m.metabolic_age} yrs` : undefined,
      bgColor: m.metabolic_age != null && m.age != null
        ? metabolicAgeRange(m.metabolic_age, m.age).bgColor : undefined,
    },
    // Body fat
    {
      label: 'Total fat',
      val: m.fat_total_pct != null ? `${m.fat_total_pct.toFixed(1)}%` : undefined,
      bgColor: m.fat_total_pct != null
        ? bodyFatRange(m.fat_total_pct, profile?.gender ?? null, m.age, profile?.ethnicity).bgColor : undefined,
    },
    {
      label: 'Visceral fat',
      val: m.visceral_fat != null ? `Level ${m.visceral_fat}` : undefined,
      bgColor: m.visceral_fat != null ? visceralFatRange(m.visceral_fat).bgColor : undefined,
    },
    { label: 'Trunk fat',  val: m.fat_trunk_pct     != null ? `${m.fat_trunk_pct.toFixed(1)}%`     : undefined, bgColor: fatSegBgColor(m.fat_trunk_pct,     profile?.gender ?? null, m.age, profile?.ethnicity ?? null) },
    { label: 'L arm fat',  val: m.fat_left_arm_pct  != null ? `${m.fat_left_arm_pct.toFixed(1)}%`  : undefined, bgColor: fatSegBgColor(m.fat_left_arm_pct,  profile?.gender ?? null, m.age, profile?.ethnicity ?? null) },
    { label: 'R arm fat',  val: m.fat_right_arm_pct != null ? `${m.fat_right_arm_pct.toFixed(1)}%` : undefined, bgColor: fatSegBgColor(m.fat_right_arm_pct, profile?.gender ?? null, m.age, profile?.ethnicity ?? null) },
    { label: 'L leg fat',  val: m.fat_left_leg_pct  != null ? `${m.fat_left_leg_pct.toFixed(1)}%`  : undefined, bgColor: fatSegBgColor(m.fat_left_leg_pct,  profile?.gender ?? null, m.age, profile?.ethnicity ?? null) },
    { label: 'R leg fat',  val: m.fat_right_leg_pct != null ? `${m.fat_right_leg_pct.toFixed(1)}%` : undefined, bgColor: fatSegBgColor(m.fat_right_leg_pct, profile?.gender ?? null, m.age, profile?.ethnicity ?? null) },
    // Muscle
    {
      label: 'Total muscle',
      val: formatWeight(m.muscle_total_kg, unitSystem),
      bgColor: m.muscle_total_kg != null
        ? muscleMassRange(m.muscle_total_kg, m.height_cm, profile?.gender ?? null, m.age).bgColor : undefined,
    },
    { label: 'Trunk muscle', val: formatWeight(m.muscle_trunk_kg,     unitSystem), bgColor: muscleSegBgColor(m.muscle_trunk_kg,     m.weight_kg) },
    { label: 'L arm muscle', val: formatWeight(m.muscle_left_arm_kg,  unitSystem), bgColor: muscleSegBgColor(m.muscle_left_arm_kg,  m.weight_kg) },
    { label: 'R arm muscle', val: formatWeight(m.muscle_right_arm_kg, unitSystem), bgColor: muscleSegBgColor(m.muscle_right_arm_kg, m.weight_kg) },
    { label: 'L leg muscle', val: formatWeight(m.muscle_left_leg_kg,  unitSystem), bgColor: muscleSegBgColor(m.muscle_left_leg_kg,  m.weight_kg) },
    { label: 'R leg muscle', val: formatWeight(m.muscle_right_leg_kg, unitSystem), bgColor: muscleSegBgColor(m.muscle_right_leg_kg, m.weight_kg) },
    // Other
    { label: 'Bone mass', val: formatWeight(m.bone_kg, unitSystem) },
  ] : []

  return (
    <AnimatePresence>
      {m && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 shadow-2xl overflow-y-auto border-l border-[#f0ebe4]"
          >
            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#9a9490] uppercase tracking-widest font-mono mb-1">Measurement</p>
                  <p className="font-serif text-lg font-medium text-[#222]">{formatDateTime(m.measured_at)}</p>
                </div>
                <button onClick={onClose} className="text-[#9a9490] hover:text-[#222] transition-colors mt-0.5">
                  <X size={18} />
                </button>
              </div>

              {/* Note */}
              <div>
                <p className="text-xs text-[#9a9490] uppercase tracking-widest font-mono mb-2">Note</p>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note — e.g. 'Started running again'"
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#e8e2db] bg-[#faf6f1] text-[#222] resize-none outline-none focus:border-[#c094e4] transition-colors"
                />
                <button
                  onClick={saveNote}
                  disabled={saving || note === (m.note ?? '')}
                  className="mt-2 flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-full bg-[#222] text-white disabled:opacity-40"
                >
                  <Save size={11} />
                  {saving ? 'Saving…' : 'Save note'}
                </button>
              </div>

              <hr className="border-[#f0ebe4]" />

              {/* All metrics */}
              <div className="grid grid-cols-2 gap-2.5">
                {metrics.map(({ label, val, bgColor }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3"
                    style={{ backgroundColor: bgColor ?? '#faf6f1' }}
                  >
                    <p className="text-xs text-[#574853] font-medium mb-1">{label}</p>
                    <p className="text-sm font-medium text-[#222]">{val ?? '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
