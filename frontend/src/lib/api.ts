import type { Profile, Measurement, Goal } from './types'

const getPassword = () => localStorage.getItem('jemo_password') || sessionStorage.getItem('jemo_password') || ''

const headers = (): Record<string, string> => {
  const pw = getPassword()
  return pw ? { 'X-Password': pw } : {}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { ...headers(), ...(options.headers || {}) },
  })
  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) throw new Error(`API error ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  profiles: {
    list: () => request<Profile[]>('/api/profiles'),
    rename: (slotId: number, name: string, ethnicity?: string) =>
      request<Profile>(`/api/profiles/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ethnicity !== undefined ? { name, ethnicity } : { name }),
      }),
  },

  measurements: {
    list: (slotId: number, days?: number) => {
      const q = days ? `?days=${days}` : ''
      return request<Measurement[]>(`/api/profiles/${slotId}/measurements${q}`)
    },
    updateNote: (slotId: number, measurementId: number, note: string | null) =>
      request<Measurement>(`/api/profiles/${slotId}/measurements/${measurementId}/note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      }),
  },

  goals: {
    list: (slotId: number) => request<Goal[]>(`/api/profiles/${slotId}/goals`),
    upsert: (slotId: number, metric: string, targetValue: number) =>
      request<Goal>(`/api/profiles/${slotId}/goals/${metric}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_value: targetValue }),
      }),
    delete: (slotId: number, metric: string) =>
      request<void>(`/api/profiles/${slotId}/goals/${metric}`, { method: 'DELETE' }),
  },

  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ profiles: { slot_id: number; added: number; skipped: number }[]; total_added: number; total_skipped: number }>(
      '/api/upload',
      { method: 'POST', body: form }
    )
  },

  checkAuth: () => fetch('/api/profiles', { headers: headers() as HeadersInit }).then(r => r.status),
}
