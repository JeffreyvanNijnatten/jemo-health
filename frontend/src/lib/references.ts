// Reference values sourced from:
// Gallagher et al. 2000 — Am J Clin Nutr 72:694-701 (body fat % by age/gender, European baseline)
// TANITA Europe documentation (visceral fat scale)
// WHO / InBody USA (body water %)
// Deurenberg et al. 1998 (ethnicity BMI/fat corrections)
// WHO Expert Consultation 2004 (Asian BMI cutoffs)

export type FatCategory = 'excellent' | 'good' | 'average' | 'high'
export type VisceralCategory = 'healthy' | 'elevated' | 'high'
export type WaterCategory = 'good' | 'low'
export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese'

// ── Ethnicity reference groups ─────────────────────────────────────────────────

export const ETHNICITY_GROUPS = [
  { value: 'european',       label: 'European',        note: 'Northern & Western European' },
  { value: 'east_asian',     label: 'East Asian',      note: 'Chinese, Japanese, Korean, SE Asian' },
  { value: 'south_asian',    label: 'South Asian',     note: 'Indian, Pakistani, Sri Lankan' },
  { value: 'african',        label: 'African',         note: 'Sub-Saharan African & Afro-Caribbean' },
  { value: 'latino',         label: 'Latino',          note: 'Central & South American' },
  { value: 'middle_eastern', label: 'Middle Eastern',  note: 'Arab, Persian, Turkish' },
] as const

// ── Body fat % ────────────────────────────────────────────────────────────────

// Correction in %-points applied to European/Gallagher baseline thresholds.
// Positive = thresholds shift up (more lenient).
// Negative = stricter — higher metabolic risk at same fat %.
// Sources: Deurenberg et al. 1998 · WHO 2004 · Gallagher et al. 2000 · IJO 2025
// These are applied ONCE — the base tables already use the European baseline.
const FAT_CORRECTION: Record<string, number> = {
  european:        0,
  east_asian:     -3,   // Higher visceral fat & insulin resistance at same fat% — Deurenberg 1998, WHO 2004
  south_asian:    -3.5, // Similar pattern; elevated cardiometabolic risk at lower fat% — WHO 2004
  african:         2,   // Higher lean mass at same BMI; protective peripheral fat distribution — Gallagher 2000, IJO 2023
  latino:          0,   // Central adiposity concern offsets the apparent leniency — Ricardo 2025, JAMA 2024
  middle_eastern: -2,   // Elevated CVD/metabolic risk at lower adiposity — IJO meta-analysis 2025
}

// Gallagher et al. 2000, European/white population baseline.
// Age bands: 20–39, 40–59, 60+. Ethnicity corrections applied separately above.
// Men: normal 8–19% / 11–21% / 13–24%. Thresholds split normal range ~60/40.
const FAT_MALE = [
  { maxAge: 40,       excellent: 10.0, good: 15.0, average: 20.0 },
  { maxAge: 60,       excellent: 13.0, good: 18.0, average: 23.0 },
  { maxAge: Infinity, excellent: 16.0, good: 21.0, average: 26.0 },
]

// Women: normal 20–33% / 23–33% / 24–35%. Gallagher overweight ≈ 34–38%.
// With Latino correction (−1): average line at 32% for women < 40. ✓
const FAT_FEMALE = [
  { maxAge: 40,       excellent: 20.0, good: 27.0, average: 33.0 },
  { maxAge: 60,       excellent: 24.0, good: 30.0, average: 36.0 },
  { maxAge: Infinity, excellent: 26.0, good: 32.0, average: 39.0 },
]

export function fatCategory(
  pct: number | null,
  gender: number | null,
  age: number | null,
  ethnicity: string | null = null
): FatCategory | null {
  if (pct == null) return null
  const a = age ?? 35
  const table = gender === 1 ? FAT_MALE : FAT_FEMALE
  const row = table.find(r => a < r.maxAge) ?? table[table.length - 1]
  const corr = FAT_CORRECTION[ethnicity ?? 'european'] ?? 0
  if (pct <= row.excellent + corr) return 'excellent'
  if (pct <= row.good + corr) return 'good'
  if (pct <= row.average + corr) return 'average'
  return 'high'
}

export function fatBandBoundaries(
  gender: number | null,
  age: number | null,
  ethnicity: string | null = null
): { excellent: number; good: number; average: number } {
  const a = age ?? 35
  const table = gender === 1 ? FAT_MALE : FAT_FEMALE
  const row = table.find(r => a < r.maxAge) ?? table[table.length - 1]
  const corr = FAT_CORRECTION[ethnicity ?? 'european'] ?? 0
  return {
    excellent: row.excellent + corr,
    good:      row.good + corr,
    average:   row.average + corr,
  }
}

export function fatCategoryLabel(cat: FatCategory): string {
  return { excellent: 'Excellent', good: 'Good', average: 'Acceptable', high: 'High' }[cat]
}

// ── BMI categories (ethnicity-adjusted) ──────────────────────────────────────
// WHO Expert Consultation 2004 · IDF metabolic syndrome criteria

const BMI_NORMAL_MAX: Record<string, number> = {
  european:       24.9,
  east_asian:     22.9,  // WHO action point: increased risk above 23
  south_asian:    22.9,  // WHO action point: same tier as East Asian
  african:        25.9,  // More lean mass; slight upward shift
  latino:         24.9,  // Aligned with European baseline
  middle_eastern: 22.9,  // Elevated cardiometabolic risk at lower BMI — IJO meta-analysis 2025
}

const BMI_OVERWEIGHT_MAX: Record<string, number> = {
  european:       29.9,
  east_asian:     27.4,  // WHO high-risk action point: 27.5
  south_asian:    27.4,  // WHO high-risk action point 27.5; 24.9 was too strict (≡ obesity threshold) — corrected
  african:        30.9,
  latino:         27.4,  // Novel cutoff ~27.2 for obesity in older Hispanic adults — Alemán-Mateo 2024
  middle_eastern: 27.4,  // Same tier as East Asian per IJO 2025
}

export function bmiBandBoundaries(ethnicity: string | null): { normal: number; overweight: number } {
  const eth = ethnicity ?? 'european'
  return {
    normal:     BMI_NORMAL_MAX[eth]      ?? 24.9,
    overweight: BMI_OVERWEIGHT_MAX[eth]  ?? 29.9,
  }
}

export function bmiCategory(
  bmi: number | null,
  ethnicity: string | null = null
): BmiCategory | null {
  if (bmi == null) return null
  const eth = ethnicity ?? 'european'
  if (bmi < 18.5) return 'underweight'
  if (bmi <= (BMI_NORMAL_MAX[eth] ?? 24.9)) return 'normal'
  if (bmi <= (BMI_OVERWEIGHT_MAX[eth] ?? 29.9)) return 'overweight'
  return 'obese'
}

export function bmiCategoryLabel(cat: BmiCategory): string {
  return {
    underweight: 'Underweight',
    normal: 'Healthy weight',
    overweight: 'Overweight',
    obese: 'High BMI',
  }[cat]
}

// ── Visceral fat (TANITA 1–59 scale) ─────────────────────────────────────────

export function visceralCategory(level: number | null): VisceralCategory | null {
  if (level == null) return null
  if (level <= 12) return 'healthy'   // TANITA official: 1–12 healthy
  if (level <= 19) return 'elevated'  // TANITA official: 13–19 elevated
  return 'high'                       // TANITA official: 20–59 high
}

// ── Body water % ─────────────────────────────────────────────────────────────

export function waterCategory(
  waterPct: number | null,
  gender: number | null
): WaterCategory | null {
  if (waterPct == null) return null
  const min = gender === 1 ? 50 : 45
  return waterPct >= min ? 'good' : 'low'
}

// ── Fat distribution (android vs gynoid) ─────────────────────────────────────
// Derived from TANITA segmental data — no user input needed.
// Ratio = trunk fat % / average leg fat %.
// Men carry more trunk fat naturally, so thresholds are sex-adjusted.
// Research: android (central) fat → higher metabolic risk; gynoid (lower-body) → cardioprotective.

export type FatDistribution = 'android' | 'balanced' | 'gynoid'

export function fatDistribution(
  trunkPct: number | null,
  rightLegPct: number | null,
  leftLegPct: number | null,
  gender: number | null
): FatDistribution | null {
  if (trunkPct == null || rightLegPct == null || leftLegPct == null) return null
  const legAvg = (rightLegPct + leftLegPct) / 2
  if (legAvg === 0) return null
  const ratio = trunkPct / legAvg
  if (gender === 1) {
    // Men: naturally higher trunk fat; android only flagged when clearly dominant
    if (ratio > 2.0) return 'android'
    if (ratio < 1.3) return 'gynoid'
    return 'balanced'
  } else {
    // Women: naturally more lower-body fat; android flagged earlier
    if (ratio > 1.2) return 'android'
    if (ratio < 0.8) return 'gynoid'
    return 'balanced'
  }
}

// ── Muscle distribution ───────────────────────────────────────────────────────
// Leg muscle is the largest and most metabolically protective group.
// Low leg fraction signals higher limb sarcopenia risk — AWGS 2019 · Janssen 2002.

export type MuscleDistribution = 'leg_dominant' | 'balanced' | 'upper_dominant'

export function muscleDistribution(
  trunkKg: number | null,
  rightArmKg: number | null,
  leftArmKg: number | null,
  rightLegKg: number | null,
  leftLegKg: number | null
): MuscleDistribution | null {
  if (trunkKg == null || rightArmKg == null || leftArmKg == null || rightLegKg == null || leftLegKg == null) return null
  const total = trunkKg + rightArmKg + leftArmKg + rightLegKg + leftLegKg
  if (total === 0) return null
  const legRatio = (rightLegKg + leftLegKg) / total
  if (legRatio > 0.48) return 'leg_dominant'
  if (legRatio < 0.38) return 'upper_dominant'
  return 'balanced'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function genderNoun(gender: number | null): string {
  return gender === 1 ? 'men' : gender === 2 ? 'women' : 'people'
}

export function isFatImproving(
  current: number | null,
  previous: number | null,
  gender: number | null,
  age: number | null,
  ethnicity: string | null = null
): boolean {
  if (current == null || previous == null) return false
  const catNow = fatCategory(current, gender, age, ethnicity)
  const catPrev = fatCategory(previous, gender, age, ethnicity)
  const order: FatCategory[] = ['excellent', 'good', 'average', 'high']
  return order.indexOf(catNow!) < order.indexOf(catPrev!)
}
