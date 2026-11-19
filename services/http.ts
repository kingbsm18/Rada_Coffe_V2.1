const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); this.name = 'ApiError' }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) throw new Error('API connection is not configured. Set NEXT_PUBLIC_API_URL to connect the RADA backend.')
  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
  if (!response.ok) {
    const detail = await response.json().catch(() => null) as { detail?: string; message?: string } | null
    throw new ApiError(detail?.detail ?? detail?.message ?? `Request failed (${response.status})`, response.status)
  }
  return response.json() as Promise<T>
}
