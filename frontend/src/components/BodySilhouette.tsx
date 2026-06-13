import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Measurement, Profile } from '../lib/types'
import { fatCategory, fatCategoryLabel } from '../lib/references'

type View = 'fat' | 'muscle'

interface Props {
  measurement: Measurement | null
  profile?: Profile | null
  view?: View
  onViewChange?: (v: View) => void
}

const FAT_CAT_COLOR = {
  excellent: '#c0f0e0',
  good:      '#d8f0c0',
  average:   '#fde8b0',
  high:      '#fad0c4',
} as const

function fatSegmentColor(pct: number | null, gender: number | null, age: number | null, ethnicity: string | null): string {
  const cat = fatCategory(pct, gender, age, ethnicity)
  if (cat == null) return '#f0ebe4'
  return FAT_CAT_COLOR[cat]
}

// 20% of body weight as "full brightness" — covers the trunk at peak muscle
function muscleSegmentColor(segKg: number | null, weightKg: number | null): string {
  if (segKg == null || weightKg == null || weightKg === 0) return '#f0ebe4'
  const t = Math.min((segKg / weightKg) * 100 / 20, 1)
  const r = Math.round(0xfd + (0xd0 - 0xfd) * t)
  const g = Math.round(0xe4 + (0x48 - 0xe4) * t)
  const b = Math.round(0xf0 + (0x88 - 0xf0) * t)
  return `rgb(${r},${g},${b})`
}

interface CalloutProps {
  bx: number; by: number   // body attachment point
  lx: number; ly: number   // label anchor
  side: 'left' | 'right'
  label: string
  value: string
}

function Callout({ bx, by, lx, ly, side, label, value }: CalloutProps) {
  const anchor = side === 'left' ? 'end' : 'start'
  const tx = side === 'left' ? lx - 6 : lx + 6
  return (
    <g>
      <circle cx={bx} cy={by} r="3" fill="#c8bfb6" />
      <line x1={bx} y1={by} x2={lx} y2={ly} stroke="#d8d0c8" strokeWidth="1" strokeDasharray="3,3" />
      <circle cx={lx} cy={ly} r="2" fill="#d8d0c8" />
      <text x={tx} y={ly - 9} textAnchor={anchor} fontSize="9.5" fontFamily="JetBrains Mono, monospace" fill="#9a9490" letterSpacing="0.08em">
        {label}
      </text>
      <text x={tx} y={ly + 6} textAnchor={anchor} fontSize="14" fontFamily="Inter, sans-serif" fontWeight="600" fill="#222">
        {value}
      </text>
    </g>
  )
}

export function BodySilhouette({ measurement: m, profile, view: externalView, onViewChange }: Props) {
  const [internalView, setInternalView] = useState<View>('fat')
  const view = externalView ?? internalView
  const setView = (v: View) => { onViewChange ? onViewChange(v) : setInternalView(v) }

  const stroke = '#e8e2db'
  const neutral = '#f5f0eb'
  const gender = profile?.gender ?? null
  const age = m?.age ?? null
  const ethnicity = profile?.ethnicity ?? null

  const colors = view === 'fat' ? {
    trunk: fatSegmentColor(m?.fat_trunk_pct ?? null, gender, age, ethnicity),
    rArm:  fatSegmentColor(m?.fat_left_arm_pct ?? null, gender, age, ethnicity),
    lArm:  fatSegmentColor(m?.fat_right_arm_pct ?? null, gender, age, ethnicity),
    rLeg:  fatSegmentColor(m?.fat_left_leg_pct ?? null, gender, age, ethnicity),
    lLeg:  fatSegmentColor(m?.fat_right_leg_pct ?? null, gender, age, ethnicity),
  } : {
    trunk: muscleSegmentColor(m?.muscle_trunk_kg ?? null, m?.weight_kg ?? null),
    rArm:  muscleSegmentColor(m?.muscle_left_arm_kg ?? null, m?.weight_kg ?? null),
    lArm:  muscleSegmentColor(m?.muscle_right_arm_kg ?? null, m?.weight_kg ?? null),
    rLeg:  muscleSegmentColor(m?.muscle_left_leg_kg ?? null, m?.weight_kg ?? null),
    lLeg:  muscleSegmentColor(m?.muscle_right_leg_kg ?? null, m?.weight_kg ?? null),
  }

  // Callouts — viewer left = anatomical RIGHT, viewer right = anatomical LEFT
  const callouts: CalloutProps[] = view === 'fat' ? [
    { label: 'LEFT ARM',  value: m?.fat_left_arm_pct  != null ? `${m.fat_left_arm_pct.toFixed(1)}%`  : '—', bx: 120, by: 162, lx: 10, ly: 148, side: 'left' },
    { label: 'TRUNK',     value: m?.fat_trunk_pct     != null ? `${m.fat_trunk_pct.toFixed(1)}%`     : '—', bx: 230, by: 227, lx: 448, ly: 265, side: 'right' },
    { label: 'RIGHT ARM', value: m?.fat_right_arm_pct != null ? `${m.fat_right_arm_pct.toFixed(1)}%` : '—', bx: 340, by: 162, lx: 448, ly: 198, side: 'right' },
    { label: 'LEFT LEG',  value: m?.fat_left_leg_pct  != null ? `${m.fat_left_leg_pct.toFixed(1)}%`  : '—', bx: 160, by: 358, lx: 10,  ly: 358, side: 'left' },
    { label: 'RIGHT LEG', value: m?.fat_right_leg_pct != null ? `${m.fat_right_leg_pct.toFixed(1)}%` : '—', bx: 300, by: 358, lx: 448, ly: 358, side: 'right' },
  ] : [
    { label: 'LEFT ARM',  value: m?.muscle_left_arm_kg  != null ? `${m.muscle_left_arm_kg.toFixed(1)} kg`  : '—', bx: 120, by: 162, lx: 10,  ly: 148, side: 'left' },
    { label: 'TRUNK',     value: m?.muscle_trunk_kg     != null ? `${m.muscle_trunk_kg.toFixed(1)} kg`     : '—', bx: 230, by: 227, lx: 448, ly: 265, side: 'right' },
    { label: 'RIGHT ARM', value: m?.muscle_right_arm_kg != null ? `${m.muscle_right_arm_kg.toFixed(1)} kg` : '—', bx: 340, by: 162, lx: 448, ly: 198, side: 'right' },
    { label: 'LEFT LEG',  value: m?.muscle_left_leg_kg  != null ? `${m.muscle_left_leg_kg.toFixed(1)} kg`  : '—', bx: 160, by: 358, lx: 10,  ly: 358, side: 'left' },
    { label: 'RIGHT LEG', value: m?.muscle_right_leg_kg != null ? `${m.muscle_right_leg_kg.toFixed(1)} kg` : '—', bx: 300, by: 358, lx: 448, ly: 358, side: 'right' },
  ]

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Internal toggle — only shown when view is not controlled from outside */}
      {externalView == null && (
        <div className="flex gap-1 bg-[#f0ebe4] rounded-full p-1">
          {(['fat', 'muscle'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-5 py-1.5 text-xs font-medium rounded-full transition-all ${
                view === v
                  ? 'bg-white text-[#222] shadow-sm'
                  : 'text-[#9a9490] hover:text-[#222]'
              }`}
            >
              {v === 'fat' ? 'Body fat' : 'Muscle'}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      {view === 'fat' ? (
        <div className="flex gap-3 text-xs text-[#9a9490] font-mono tracking-wide">
          {(Object.entries(FAT_CAT_COLOR) as [keyof typeof FAT_CAT_COLOR, string][]).map(([cat, color]) => (
            <span key={cat} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
              {fatCategoryLabel(cat)}
            </span>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-[#9a9490] font-mono tracking-wide">
          <span>Less</span>
          <span
            className="inline-block w-20 h-2.5 rounded-sm"
            style={{ background: 'linear-gradient(to right, #fde4f0, #d04888)' }}
          />
          <span>More</span>
          <span className="ml-1 text-[#b8b0a8]">% of body weight</span>
        </div>
      )}

      <motion.div
        key={view}
        initial={{ opacity: 0.7, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <svg viewBox="-50 0 600 490" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">

          {/* Viewer left arm = anatomical RIGHT arm */}
          <path
            d="M168,106 L146,104 C132,104 118,116 116,132 L108,218 C106,234 114,246 127,248 L151,252 C163,254 170,244 170,230 L166,136 C165,118 168,106 168,106 Z"
            fill={colors.rArm} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"
          />

          {/* Viewer right arm = anatomical LEFT arm */}
          <path
            d="M292,106 L314,104 C328,104 342,116 344,132 L352,218 C354,234 346,246 333,248 L309,252 C297,254 290,244 290,230 L294,136 C295,118 292,106 292,106 Z"
            fill={colors.lArm} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"
          />

          {/* Trunk */}
          <path
            d="M168,106 C158,106 148,118 147,134 L144,212 C142,227 145,238 152,244 L160,260 C166,278 207,287 230,287 C253,287 294,278 300,260 L308,244 C315,238 318,227 316,212 L313,134 C311,118 302,106 292,106 Z"
            fill={colors.trunk} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"
          />

          {/* Viewer left leg = anatomical RIGHT leg */}
          <path
            d="M212,288 L183,282 C168,278 158,292 156,310 L150,410 C148,428 160,442 178,442 C196,442 208,428 208,410 L212,308 C214,296 213,290 212,288 Z"
            fill={colors.rLeg} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"
          />

          {/* Viewer right leg = anatomical LEFT leg */}
          <path
            d="M248,288 L277,282 C292,278 302,292 304,310 L310,410 C312,428 300,442 282,442 C264,442 252,428 252,410 L248,308 C246,296 247,290 248,288 Z"
            fill={colors.lLeg} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"
          />

          {/* Neck (neutral) */}
          <path d="M218,78 L242,78 L244,106 Q230,110 216,106 Z" fill={neutral} stroke={stroke} strokeWidth="1" />

          {/* Head (neutral) */}
          <ellipse cx="230" cy="46" rx="28" ry="34" fill={neutral} stroke={stroke} strokeWidth="1.5" />

          {/* Callout lines and labels */}
          {callouts.map((c, i) => (
            <Callout key={i} {...c} />
          ))}

        </svg>
      </motion.div>
    </div>
  )
}
