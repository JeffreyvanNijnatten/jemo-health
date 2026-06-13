import { motion } from 'framer-motion'
import { Pencil } from 'lucide-react'
import type { Profile } from '../lib/types'

interface Props {
  profiles: Profile[]
  activeId: number
  onSwitch: (id: number) => void
  onEditProfile: (profile: Profile) => void
}

export function ProfileSwitcher({ profiles, activeId, onSwitch, onEditProfile }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {profiles.map((p) => {
        const isActive = p.slot_id === activeId
        const displayName = p.name || `Profile ${p.slot_id}`

        return (
          <motion.div key={p.slot_id} layout className="flex items-center gap-1">
            <div className="flex items-center gap-1 group">
              <button
                onClick={() => onSwitch(p.slot_id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                  isActive
                    ? 'bg-[#222] text-white'
                    : 'bg-white text-[#7a7876] hover:text-[#222] border border-[#e8e2db]'
                }`}
              >
                {displayName}
              </button>
              <button
                onClick={() => onEditProfile(p)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9a9490] hover:text-[#222]"
                title="Edit profile"
              >
                <Pencil size={12} />
              </button>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
