import { appConfig, isApiConfigured } from './config'

export type BackendReadiness = { status: 'ready' | 'not_ready'; checks: Record<string, { status: string }> }

export async function fetchBackendReadiness(signal?: AbortSignal): Promise<BackendReadiness> {
  if (!isApiConfigured()) throw new Error('NEXT_PUBLIC_RADA_API_URL is not configured.')
  const response = await fetch(`${appConfig.apiBaseUrl}/health/ready`, { signal, cache: 'no-store', headers: { Accept: 'application/json' } })
  const body = await response.json().catch(() => null) as BackendReadiness | null
  if (!body) throw new Error(`Readiness check failed (${response.status})`)
  return body
}
