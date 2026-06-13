import { useState } from 'react'
import type { UnitSystem } from '../lib/types'

export function useSettings() {
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(() => {
    return (localStorage.getItem('jemo_units') as UnitSystem) || 'metric'
  })

  const [timezone, setTimezoneState] = useState<string>(() => {
    return localStorage.getItem('jemo_timezone') ||
      Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  const [appName, setAppNameState] = useState<string>(() => {
    return localStorage.getItem('jemo_app_name') || 'JEMO'
  })

  const setUnitSystem = (u: UnitSystem) => {
    localStorage.setItem('jemo_units', u)
    setUnitSystemState(u)
  }

  const setTimezone = (tz: string) => {
    localStorage.setItem('jemo_timezone', tz)
    setTimezoneState(tz)
  }

  const setAppName = (name: string) => {
    localStorage.setItem('jemo_app_name', name)
    setAppNameState(name)
  }

  const formatDate = (isoString: string) => {
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric', month: 'short', year: 'numeric',
      timeZone: timezone,
    }).format(new Date(isoString))
  }

  const formatDateTime = (isoString: string) => {
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: timezone,
    }).format(new Date(isoString))
  }

  return { unitSystem, setUnitSystem, timezone, setTimezone, appName, setAppName, formatDate, formatDateTime }
}
