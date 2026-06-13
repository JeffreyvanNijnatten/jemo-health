import { useState } from 'react'

interface Props {
  onLogin: (password: string, remember: boolean) => void
  error?: boolean
}

export function Login({ onLogin, error }: Props) {
  const [pw, setPw] = useState('')
  const [remember, setRemember] = useState(false)

  const submit = () => {
    if (pw) onLogin(pw, remember)
  }

  return (
    <div className="min-h-screen bg-[#fff9f3] flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-medium tracking-tight text-[#222] mb-2">
            JEMO <span className="gradient-text">Health</span>
          </h1>
          <p className="text-sm text-[#7a7876]">
            Your family's health, beautifully at a glance.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 flex flex-col gap-4">
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-[#7a7876] block mb-2">
              Password
            </label>
            <input
              type="password"
              value={pw}
              autoFocus
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-xl border border-[#e5e5e5] bg-[#fff9f3] text-[#222] outline-none focus:border-[#c094e4] transition-colors text-sm"
            />
            {error && (
              <p className="text-xs text-[#be5178] mt-1.5">That doesn't look right. Try again.</p>
            )}
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="w-4 h-4 rounded accent-[#c094e4] cursor-pointer"
            />
            <span className="text-xs text-[#7a7876]">Remember me on this device</span>
          </label>
          <button
            onClick={submit}
            disabled={!pw}
            className="w-full py-3 rounded-full bg-[#222] text-white text-sm font-medium disabled:opacity-40 transition-opacity"
          >
            Let me in →
          </button>
        </div>
      </div>
    </div>
  )
}
