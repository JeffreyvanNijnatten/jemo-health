// Health range indicators per metric.
// Returns { label, color, description } based on value, optional gender, and optional ethnicity.
// Ethnicity adjustments: Deurenberg et al. 1998, WHO Expert Consultation 2004, Gallagher et al. 2000, IJO 2025.

import { fatBandBoundaries, type FatDistribution, type MuscleDistribution } from './references'

export type HealthStatus = 'great' | 'good' | 'ok' | 'attention'

export interface HealthRange {
  status: HealthStatus
  label: string
  description: string
  color: string
  bgColor: string
  textColor: string
}

const STATUSES: Record<HealthStatus, Pick<HealthRange, 'color' | 'bgColor' | 'textColor'>> = {
  great:     { color: '#0d9488', bgColor: '#daf7ee', textColor: '#0d9488' },
  good:      { color: '#7c6fa0', bgColor: '#e9e0f7', textColor: '#7c6fa0' },
  ok:        { color: '#b87333', bgColor: '#ffe9cf', textColor: '#b87333' },
  attention: { color: '#be5178', bgColor: '#fce0ee', textColor: '#be5178' },
}

function range(status: HealthStatus, label: string, description: string): HealthRange {
  return { status, label, description, ...STATUSES[status] }
}

// ── BMI ───────────────────────────────────────────────────────────────────────
// WHO Expert Consultation 2004 · IDF metabolic syndrome criteria · IJO 2025
const BMI_NORMAL_MAX: Record<string, number> = {
  european: 24.9, east_asian: 22.9, south_asian: 22.9,
  african: 25.9, latino: 24.9, middle_eastern: 22.9,
}
const BMI_OVER_MAX: Record<string, number> = {
  european: 29.9, east_asian: 27.4, south_asian: 27.4,
  african: 30.9, latino: 27.4, middle_eastern: 27.4,
}

export function bmiRange(bmi: number, ethnicity?: string | null): HealthRange {
  const eth = ethnicity ?? 'european'
  const nMax = BMI_NORMAL_MAX[eth] ?? 24.9
  const oMax = BMI_OVER_MAX[eth] ?? 29.9
  if (bmi < 18.5)  return range('attention', 'Underweight',   `BMI is below the healthy range — aim for at least 18.5`)
  if (bmi <= nMax) return range('great',     'Healthy weight', 'In a great range for your profile')
  if (bmi <= oMax) return range('ok',        'Slightly high',  `A little above ideal for your reference group — aim for ${nMax} or below`)
  return             range('attention',      'High',           `Above the recommended range for your reference group — aim for ${nMax} or below`)
}

export function weightRange(weightKg: number, heightCm: number, ethnicity?: string | null): HealthRange {
  const h = heightCm / 100
  const bmi = weightKg / (h * h)
  const eth = ethnicity ?? 'european'
  const nMax = BMI_NORMAL_MAX[eth] ?? 24.9
  const oMax = BMI_OVER_MAX[eth] ?? 29.9
  const minKg = Math.round(18.5 * h * h)
  const maxKg = Math.round(nMax * h * h)
  const desc = `BMI-based estimate for your height: ${minKg}–${maxKg} kg`
  if (bmi < 18.5)  return range('attention', 'Underweight',   desc)
  if (bmi <= nMax) return range('great',     'Healthy weight', desc)
  if (bmi <= oMax) return range('ok',        'Slightly high',  desc)
  return             range('attention',      'Above range',    desc)
}

// ── Body fat % ────────────────────────────────────────────────────────────────
// Age-banded thresholds + ethnicity corrections delegate to references.ts (single source of truth).
// distribution is derived from TANITA segmental data and adjusts the description text only —
// thresholds remain population-calibrated; android/gynoid context is purely informational.
export function bodyFatRange(
  pct: number,
  gender: number | null,
  age?: number | null,
  ethnicity?: string | null,
  distribution?: FatDistribution | null
): HealthRange {
  const { excellent, good, average } = fatBandBoundaries(gender, age ?? null, ethnicity ?? null)
  const essentialMin = gender !== 2 ? 5 : 14

  if (pct < essentialMin) return range('attention', 'Very low', 'Below essential fat levels')
  if (pct < excellent)    return range('great',     'Athletic', 'Excellent fat levels for your profile')

  if (pct < good) return range('good', 'Fit',
    distribution === 'android'
      ? "In a healthy range — trunk-heavy pattern is worth monitoring"
      : "You're in a healthy range"
  )

  if (pct < average) return range('ok', 'Acceptable',
    distribution === 'android' ? 'Central fat raises metabolic risk here — prioritise cardio'
    : distribution === 'gynoid' ? 'Slightly above ideal — lower-body distribution is cardioprotective'
    : 'Slightly above ideal'
  )

  return range('attention', 'High',
    distribution === 'android' ? 'Central fat pattern amplifies risk — this is the most important number to address'
    : distribution === 'gynoid' ? 'Above range overall — lower-body distribution is the safer pattern, but reducing total fat is still worthwhile'
    : 'Worth working on gradually'
  )
}

// ── Muscle mass ───────────────────────────────────────────────────────────────
// Skeletal Muscle Mass Index (SMMI) = muscle_kg / height_m².
// Thresholds: fitness ranges extended upward from AWGS 2019 BIA sarcopenia cutoffs
// (men < 7.0 kg/m², women < 5.7 kg/m²). Age adjustment: −0.5 (40–59), −1.0 (60+).
export function muscleMassRange(
  muscleKg: number,
  heightCm: number | null,
  gender: number | null,
  age?: number | null,
  distribution?: MuscleDistribution | null
): HealthRange {
  if (!heightCm) return range('good', 'Recorded', 'Add height to your profile for a full assessment')

  const h = heightCm / 100
  const smmi = muscleKg / (h * h)
  const a = age ?? 35
  const ageAdj = a >= 60 ? -1.0 : a >= 40 ? -0.5 : 0
  const male = gender !== 2

  const [tGreat, tGood, tOk] = male ? [11.0, 9.5, 8.0] : [7.5, 6.5, 5.7]

  const distNote = distribution === 'leg_dominant'
    ? ' Strong lower-body muscle is the most protective for metabolism.'
    : distribution === 'upper_dominant'
    ? ' Building leg muscle reduces sarcopenia risk.'
    : ''

  if (smmi >= tGreat + ageAdj) return range('great', 'Excellent',   `Well above the healthy range for your profile.${distNote}`)
  if (smmi >= tGood  + ageAdj) return range('good',  'Good',        `In a solid healthy range.${distNote}`)
  if (smmi >= tOk    + ageAdj) return range('ok',    'Adequate',    `Within range — maintaining or building is worthwhile.${distNote}`)
  return                         range('attention',   'Below range', `Below the recommended range — resistance training and protein are the key levers.${distNote}`)
}

// ── Visceral fat ──────────────────────────────────────────────────────────────
// TANITA official scale: 1–12 healthy · 13–19 elevated · 20–59 high
// Visceral fat wraps around internal organs (liver, pancreas, intestines).
// It is the metabolically active fat most strongly linked to insulin resistance and CVD.
export function visceralFatRange(level: number): HealthRange {
  if (level <= 12) return range('great', 'Healthy',
    'Visceral fat wraps around your internal organs. At 1–12 it is in the ideal range — your organs are well-protected without excess.'
  )
  if (level <= 19) return range('ok', 'Elevated',
    'Visceral fat at 13–19 is accumulating around your organs and is linked to early insulin resistance and metabolic syndrome. Consistent cardio and fewer refined carbs are the most effective levers.'
  )
  return range('attention', 'High',
    'A level of 20+ significantly raises the risk of type 2 diabetes, cardiovascular disease, and insulin resistance. The good news: visceral fat responds faster to lifestyle changes than any other fat type — cardio first.'
  )
}

// ── Metabolic age ─────────────────────────────────────────────────────────────
// Metabolic age is estimated from your resting metabolic rate (RMR) compared to
// average RMR values across age groups. It reflects how efficiently your body
// burns energy at rest — largely driven by muscle mass and body composition.
export function metabolicAgeRange(metabolicAge: number, actualAge: number): HealthRange {
  const diff = metabolicAge - actualAge
  if (diff <= -5) return range('great', `${Math.abs(diff)} yrs younger`,
    `Your body burns energy at a rate typical of someone ${Math.abs(diff)} years younger than you. This reflects strong muscle mass and efficient metabolism — the result of good body composition and consistent activity.`
  )
  if (diff <= 0) return range('good', 'On point',
    'Your metabolic rate matches what is expected for your actual age. A healthy baseline — muscle mass and body composition are well balanced.'
  )
  if (diff <= 5) return range('ok', `${diff} yrs older`,
    `Your body is burning energy at a rate typical of someone ${diff} years older. This usually points to slightly lower muscle mass or higher fat percentage. Both respond well to resistance training and more protein.`
  )
  return range('attention', `${diff} yrs older`,
    `Your metabolism is running significantly slower than average for your age group. The most effective lever: build muscle through resistance training. Muscle tissue raises your resting metabolic rate — even small gains make a measurable difference.`
  )
}

// ── Body water ────────────────────────────────────────────────────────────────
export function waterPctRange(waterPct: number, gender?: number | null): HealthRange {
  const lo = gender === 1 ? 50 : 45
  const hi = gender === 1 ? 65 : 60
  if (waterPct > hi)      return range('ok',        'A little high', 'Slightly above the typical range — not a concern')
  if (waterPct >= lo)     return range('great',     'Well hydrated', 'Your body water is right where it should be')
  if (waterPct >= lo - 5) return range('ok',        'Slightly low',  'Try to drink a bit more water through the day')
  return                   range('attention',      'Low',           'You may be dehydrated — focus on drinking more fluids')
}

// ── Resting calories ──────────────────────────────────────────────────────────
const ACTIVITY_MULT: Partial<Record<number, [number, string]>> = {
  1: [1.20,  'low activity'],
  2: [1.375, 'standard activity'],
  3: [1.55,  'moderate activity'],
  4: [1.725, 'high activity'],
  5: [1.90,  'athletic training'],
}

export function restingCaloriesRange(kcal: number, activityLevel?: number | null): HealthRange {
  const [mult, actLabel] = ACTIVITY_MULT[activityLevel ?? 2] ?? [1.375, 'light activity']
  const daily = Math.round((kcal * mult) / 10) * 10
  return range('good', `~${daily} kcal/day with ${actLabel}`, `This is what your body burns at complete rest.`)
}
