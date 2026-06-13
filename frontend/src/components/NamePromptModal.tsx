import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, X } from 'lucide-react'
import type { Profile } from '../lib/types'
import { ETHNICITY_GROUPS } from '../lib/references'
import { api } from '../lib/api'

interface Props {
  profile: Profile
  onNamed: (profile: Profile) => void
  onClose?: () => void
}

const GENDER_LABEL: Record<number, string> = { 1: 'Male', 2: 'Female' }
const ACTIVITY_LABEL: Record<number, string> = {
  1: 'Low activity', 2: 'Standard activity', 3: 'Active', 4: 'Very active', 5: 'Athletic',
}

function getAge(dob: string | null): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--
  return age
}

function formatDOB(dob: string | null): string {
  if (!dob) return '—'
  return new Date(dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function NamePromptModal({ profile, onNamed, onClose }: Props) {
  const [name, setName] = useState(profile.name ?? '')
  const [ethnicity, setEthnicity] = useState<string>(profile.ethnicity ?? 'european')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const updated = await api.profiles.rename(profile.slot_id, name.trim(), ethnicity)
      onNamed(updated)
    } finally {
      setSaving(false)
    }
  }

  const isEditing = !!profile.name
  const age = getAge(profile.date_of_birth)
  const gender = profile.gender ? GENDER_LABEL[profile.gender] : null
  const activity = profile.activity_level ? ACTIVITY_LABEL[profile.activity_level] : null

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-[#f0ebe4] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#faf0ff]">
            <User size={22} className="text-[#c094e4]" />
          </div>
          {onClose && (
            <button onClick={onClose} className="text-[#9a9490] hover:text-[#222] transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        <h2 className="font-serif text-2xl font-medium text-[#222] mb-1">
          {isEditing ? 'Edit profile' : 'Who is this?'}
        </h2>
        <p className="text-sm text-[#9a9490] mb-6">
          {isEditing
            ? 'Update the name and body composition reference for this profile.'
            : 'Give this profile a name so you know whose data you\'re looking at.'}
        </p>

        {/* Profile data to identify the person */}
        <div className="bg-[#faf6f1] rounded-2xl p-4 mb-5 space-y-2">
          <p className="text-xs font-mono text-[#9a9490] uppercase tracking-widest mb-3">
            Profile {profile.slot_id} data
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {gender && (
              <div>
                <span className="text-[#9a9490] text-xs">Gender</span>
                <p className="font-medium text-[#222]">{gender}</p>
              </div>
            )}
            {age != null && (
              <div>
                <span className="text-[#9a9490] text-xs">Age</span>
                <p className="font-medium text-[#222]">{age} years</p>
              </div>
            )}
            {profile.date_of_birth && (
              <div>
                <span className="text-[#9a9490] text-xs">Born</span>
                <p className="font-medium text-[#222]">{formatDOB(profile.date_of_birth)}</p>
              </div>
            )}
            {profile.height_cm && (
              <div>
                <span className="text-[#9a9490] text-xs">Height</span>
                <p className="font-medium text-[#222]">{profile.height_cm} cm</p>
              </div>
            )}
            {activity && (
              <div className="col-span-2">
                <span className="text-[#9a9490] text-xs">Activity level</span>
                <p className="font-medium text-[#222]">{activity}</p>
              </div>
            )}
          </div>
        </div>

        {/* Name input */}
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="e.g. Jeffrey, Emma…"
          className="w-full px-4 py-3 rounded-xl border border-[#e8e2db] bg-white text-[#222] outline-none focus:border-[#c094e4] transition-colors text-sm mb-5"
        />

        {/* Ethnicity / body composition reference group */}
        <div className="mb-5">
          <p className="text-xs font-mono text-[#9a9490] uppercase tracking-widest mb-1">
            Body composition reference
          </p>
          <p className="text-xs text-[#9a9490] mb-3">
            Calibrates BMI and body fat benchmarks to your background.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ETHNICITY_GROUPS.map(group => (
              <button
                key={group.value}
                type="button"
                onClick={() => setEthnicity(group.value)}
                className={`px-3 py-2.5 text-left rounded-xl border transition-all ${
                  ethnicity === group.value
                    ? 'border-[#c094e4] bg-[#faf0ff]'
                    : 'border-[#e8e2db] hover:border-[#c094e4]'
                }`}
              >
                <p className={`text-sm font-medium ${ethnicity === group.value ? 'text-[#c094e4]' : 'text-[#222]'}`}>
                  {group.label}
                </p>
                <p className="text-xs text-[#9a9490] mt-0.5 leading-tight">{group.note}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving || !name.trim()}
          className="w-full py-3 rounded-full bg-[#222] text-white text-sm font-medium disabled:opacity-40 transition-opacity hover:opacity-90"
        >
          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Set name'}
        </button>
      </motion.div>
    </div>
  )
}
