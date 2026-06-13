import { useState } from 'react'
import type { UnitSystem } from '../lib/types'

interface Props {
  unitSystem: UnitSystem
  onUnitChange: (u: UnitSystem) => void
  timezone: string
  onTimezoneChange: (tz: string) => void
  appName: string
  onAppNameChange: (name: string) => void
  onClose: () => void
}

const TIMEZONES = Intl.supportedValuesOf?.('timeZone') ?? [
  'Europe/Amsterdam', 'Europe/London', 'America/New_York', 'America/Los_Angeles',
  'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney', 'UTC',
]

export function Settings({ unitSystem, onUnitChange, timezone, onTimezoneChange, appName, onAppNameChange, onClose }: Props) {
  const [nameInput, setNameInput] = useState(appName)

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-[#222] tracking-tight">Settings</h2>
          <button onClick={onClose} className="text-[#7a7876] hover:text-[#222]">✕</button>
        </div>

        <div className="space-y-6">
          {/* App name */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-[#7a7876] mb-1">App name</p>
            <p className="text-xs text-[#7a7876] mb-3">
              Replaces "JEMO" in the title — shown as <em>{nameInput || 'JEMO'} Health</em>.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') onAppNameChange(nameInput || 'JEMO') }}
                placeholder="JEMO"
                maxLength={20}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-[#e5e5e5] bg-[#fff9f3] text-[#222] outline-none focus:border-[#c094e4]"
              />
              <button
                onClick={() => onAppNameChange(nameInput || 'JEMO')}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-[#222] text-white"
              >
                Save
              </button>
            </div>
          </div>

          {/* Units */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-[#7a7876] mb-3">Units</p>
            <div className="flex gap-2">
              {(['metric', 'imperial'] as UnitSystem[]).map(u => (
                <button
                  key={u}
                  onClick={() => onUnitChange(u)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    unitSystem === u
                      ? 'bg-[#222] text-white'
                      : 'bg-[#f5f5f5] text-[#7a7876] hover:text-[#222]'
                  }`}
                >
                  {u === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lbs, in)'}
                </button>
              ))}
            </div>
          </div>

          {/* Timezone */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-[#7a7876] mb-1">Timezone</p>
            <p className="text-xs text-[#7a7876] mb-3">
              Auto-detected from your browser. Change if your measurements show the wrong time.
            </p>
            <select
              value={timezone}
              onChange={e => onTimezoneChange(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#e5e5e5] bg-[#fff9f3] text-[#222] outline-none focus:border-[#c094e4]"
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <hr className="border-[#f0f0f0]" />

          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-[#7a7876] mb-2">About</p>
            <p className="text-sm text-[#7a7876] leading-relaxed">
              JEMO Health reads data from your TANITA BC-601 body composition scale.
              Upload the TANITA folder from your SD card or USB drive to add new measurements.
            </p>
            <p className="text-sm text-[#7a7876] mt-2">
              Created by <span className="text-[#222] font-medium">Jeffrey van Nijnatten</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
