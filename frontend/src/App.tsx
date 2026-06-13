import { useEffect, useState } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { useSettings } from './hooks/useSettings'
import { api } from './lib/api'

export default function App() {
  const { unitSystem, setUnitSystem, timezone, setTimezone, appName, setAppName, formatDate, formatDateTime } = useSettings()
  const [authState, setAuthState] = useState<'checking' | 'ok' | 'login'>('checking')
  const [loginError, setLoginError] = useState(false)

  useEffect(() => {
    api.checkAuth().then(status => {
      setAuthState(status === 401 ? 'login' : 'ok')
    }).catch(() => setAuthState('ok'))
  }, [])

  const handleLogin = async (password: string, remember: boolean) => {
    if (remember) {
      localStorage.setItem('jemo_password', password)
      sessionStorage.removeItem('jemo_password')
    } else {
      sessionStorage.setItem('jemo_password', password)
      localStorage.removeItem('jemo_password')
    }
    const status = await api.checkAuth()
    if (status === 401) {
      localStorage.removeItem('jemo_password')
      sessionStorage.removeItem('jemo_password')
      setLoginError(true)
    } else {
      setLoginError(false)
      setAuthState('ok')
    }
  }

  if (authState === 'checking') return null

  if (authState === 'login') {
    return <Login onLogin={handleLogin} error={loginError} />
  }

  return (
    <Dashboard
      unitSystem={unitSystem}
      onUnitChange={setUnitSystem}
      timezone={timezone}
      onTimezoneChange={setTimezone}
      appName={appName}
      onAppNameChange={setAppName}
      formatDate={formatDate}
      formatDateTime={formatDateTime}
    />
  )
}
