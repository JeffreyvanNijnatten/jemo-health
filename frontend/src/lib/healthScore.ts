// Composite health score (0–100) derived from all available body composition metrics.
// Each metric is mapped to a 0–100 sub-score based on clinical range thresholds,
// then combined as a weighted average. Only metrics present in the measurement are included.
//
// Weights reflect relative cardiometabolic significance:
//   Body fat %     25  (Gallagher 2000 — strongest predictor of metabolic risk)
//   Visceral fat   22  (TANITA scale; visceral adiposity drives insulin resistance most directly)
//   Muscle (SMMI)  20  (AWGS 2019 — sarcopenia risk, resting metabolic rate)
//   BMI            18  (WHO / ethnicity-adjusted — structural weight context)
//   Metabolic age  10  (TANITA — integrative metabolic marker)
//   Hydration       5  (WHO body water %; supportive, not primary)

import type { Measurement, Profile } from './types'
import { fatCategory, visceralCategory, bmiCategory, waterCategory } from './references'

export interface ScoreComponent {
  name: string
  score: number
  weight: number
}

export interface HealthScoreResult {
  score: number
  components: ScoreComponent[]
}

export function computeHealthScore(m: Measurement, profile: Profile): HealthScoreResult | null {
  const components: ScoreComponent[] = []

  // Body fat % (weight: 25)
  const fatCat = fatCategory(m.fat_total_pct, profile.gender, m.age, profile.ethnicity)
  if (fatCat) {
    const score = { excellent: 100, good: 78, average: 50, high: 18 }[fatCat]
    components.push({ name: 'Body fat', score, weight: 25 })
  }

  // Visceral fat (weight: 22)
  const viscCat = visceralCategory(m.visceral_fat)
  if (viscCat) {
    const score = { healthy: 100, elevated: 48, high: 12 }[viscCat]
    components.push({ name: 'Visceral fat', score, weight: 22 })
  }

  // Muscle mass — SMMI = muscle_kg / height_m² (weight: 20)
  // Thresholds from health.ts muscleMassRange (extended from AWGS 2019 BIA cutoffs)
  if (m.muscle_total_kg != null && profile.height_cm) {
    const h = profile.height_cm / 100
    const smmi = m.muscle_total_kg / (h * h)
    const a = m.age ?? 35
    const ageAdj = a >= 60 ? -1.0 : a >= 40 ? -0.5 : 0
    const male = profile.gender !== 2
    const [tGreat, tGood, tOk] = male ? [11.0, 9.5, 8.0] : [7.5, 6.5, 5.7]
    const score =
      smmi >= tGreat + ageAdj ? 100
      : smmi >= tGood + ageAdj ? 78
      : smmi >= tOk + ageAdj ? 52
      : 20
    components.push({ name: 'Muscle', score, weight: 20 })
  }

  // BMI — ethnicity-adjusted (weight: 18)
  const bmiCat = bmiCategory(m.bmi, profile.ethnicity)
  if (bmiCat) {
    const score = { normal: 100, underweight: 55, overweight: 55, obese: 20 }[bmiCat]
    components.push({ name: 'BMI', score, weight: 18 })
  }

  // Metabolic age vs chronological age (weight: 10)
  if (m.metabolic_age != null && m.age != null) {
    const diff = m.metabolic_age - m.age
    const score =
      diff <= -5 ? 100
      : diff <= 0 ? 82
      : diff <= 5 ? 58
      : diff <= 10 ? 33
      : 10
    components.push({ name: 'Metabolic age', score, weight: 10 })
  }

  // Body water % (weight: 5)
  const waterCat = waterCategory(m.water_pct, profile.gender)
  if (waterCat) {
    const score = waterCat === 'good' ? 100 : 40
    components.push({ name: 'Hydration', score, weight: 5 })
  }

  if (components.length === 0) return null

  const totalWeight = components.reduce((s, c) => s + c.weight, 0)
  const score = components.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight

  return { score, components }
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#0d9488'
  if (score >= 65) return '#7c6fa0'
  if (score >= 45) return '#b87333'
  return '#be5178'
}

export function scoreBgColor(score: number): string {
  if (score >= 80) return '#daf7ee'
  if (score >= 65) return '#e9e0f7'
  if (score >= 45) return '#ffe9cf'
  return '#fce0ee'
}
