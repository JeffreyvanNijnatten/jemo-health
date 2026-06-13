export interface Profile {
  slot_id: number
  name: string | null
  date_of_birth: string | null
  gender: number | null   // 1=male, 2=female
  height_cm: number | null
  body_type: number | null  // 0=standard, 2=athlete
  activity_level: number | null
  ethnicity: string | null
}

export interface Measurement {
  id: number
  profile_id: number
  measured_at: string   // ISO datetime
  height_cm: number | null
  body_type: number | null
  activity_level: number | null
  age: number | null
  weight_kg: number | null
  bmi: number | null
  fat_total_pct: number | null
  fat_trunk_pct: number | null
  fat_right_arm_pct: number | null
  fat_left_arm_pct: number | null
  fat_right_leg_pct: number | null
  fat_left_leg_pct: number | null
  muscle_total_kg: number | null
  muscle_trunk_kg: number | null
  muscle_right_arm_kg: number | null
  muscle_left_arm_kg: number | null
  muscle_right_leg_kg: number | null
  muscle_left_leg_kg: number | null
  bone_kg: number | null
  visceral_fat: number | null
  resting_calories: number | null
  metabolic_age: number | null
  water_pct: number | null
  note: string | null
}

export interface Goal {
  id: number
  profile_id: number
  metric: string
  target_value: number
  updated_at: string
}

export type GoalMap = Record<string, number>

export type Theme = 'light' | 'dark' | 'system'
export type UnitSystem = 'metric' | 'imperial'
