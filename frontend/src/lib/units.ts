import type { UnitSystem } from './types'

export function kgToLbs(kg: number) { return kg * 2.20462 }
export function lbsToKg(lbs: number) { return lbs / 2.20462 }
export function cmToInches(cm: number) { return cm / 2.54 }
export function cmToFtIn(cm: number) {
  const totalInches = cm / 2.54
  const ft = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return `${ft}'${inches}"`
}

export function formatWeight(kg: number | null | undefined, system: UnitSystem, decimals = 1) {
  if (kg == null) return '—'
  if (system === 'imperial') return `${kgToLbs(kg).toFixed(decimals)} lbs`
  return `${kg.toFixed(decimals)} kg`
}

export function formatHeight(cm: number | null | undefined, system: UnitSystem) {
  if (cm == null) return '—'
  if (system === 'imperial') return cmToFtIn(cm)
  return `${cm} cm`
}

export function weightUnit(system: UnitSystem) {
  return system === 'imperial' ? 'lbs' : 'kg'
}

export function weightValue(kg: number | null | undefined, system: UnitSystem) {
  if (kg == null) return null
  return system === 'imperial' ? kgToLbs(kg) : kg
}
