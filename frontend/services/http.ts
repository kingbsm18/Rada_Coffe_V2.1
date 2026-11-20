import { appConfig } from './config'
export type ApiErrorKind = 'unauthorized' | 'forbidden' | 'not_found' | 'validation' | 'server' | 'network' | 'timeout' | 'cancelled' | 'unknown'
export class ApiError extends Error {
  constructor(message: string, public readonly kind: ApiErrorKind, public readonly status?: number, public readonly details?: unknown, public readonly requestId?: string) {
    super(message)
    this.name = 'ApiError'
  }
}

let accessTokenProvider: (() => string | null | Promise<string | null>) | undefined
let refreshSession: (() => Promise<string | null>) | undefined
export function configureApiAuthentication(options: { getAccessToken?: () => string | null | Promise<string | null>; refresh?: () => Promise<string | null> }) {
  accessTokenProvider = options.getAccessToken
  refreshSession = options.refresh
}

export function buildQuery(params?: object) {
  const query = new URLSearchParams()
  if (!params) return ''
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  const result = query.toString()
  return result ? `?${result}` : ''
}

export function buildApiUrl(path: string) {
  if (!appConfig.apiBaseUrl) throw new ApiError('API mode is selected, but NEXT_PUBLIC_RADA_API_URL is not configured.', 'network')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const unversionedPath = cleanPath.replace(/^\/v\d+(?=\/|$)/, '')
  return `${appConfig.apiBaseUrl}/${appConfig.apiVersion}${unversionedPath}`
}

async function execute<T>(path: string, init: RequestInit, retried = false, forcedToken?: string): Promise<T> {
  const timeoutController = new AbortController()
  const timeout = setTimeout(() => timeoutController.abort(new DOMException('Request timed out', 'TimeoutError')), appConfig.requestTimeoutMs)
  const signal = init.signal ? AbortSignal.any([init.signal, timeoutController.signal]) : timeoutController.signal
  try {
    const headers = new Headers(init.headers)
    if (!headers.has('Accept')) headers.set('Accept', 'application/json')
    if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
    if (appConfig.authenticationStrategy === 'bearer' && accessTokenProvider) {
      const token = forcedToken ?? await accessTokenProvider()
      if (token) headers.set('Authorization', `Bearer ${token}`)
    }
    const response = await fetch(buildApiUrl(path), { ...init, headers, signal, credentials: appConfig.authenticationStrategy === 'http-only-cookie' ? 'include' : init.credentials, cache: 'no-store' })
    if (response.status === 401 && !retried && refreshSession) {
      const refreshedToken = await refreshSession()
      if (refreshedToken) {
        const retryHeaders = new Headers(headers)
        retryHeaders.set('Authorization', `Bearer ${refreshedToken}`)
        return await execute<T>(path, { ...init, headers: retryHeaders }, true, refreshedToken)
      }
    }
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { code?: string; detail?: string | Array<unknown>; message?: string; errors?: unknown; request_id?: string } | null
      const kind: ApiErrorKind = response.status === 401 ? 'unauthorized' : response.status === 403 ? 'forbidden' : response.status === 404 ? 'not_found' : response.status === 422 ? 'validation' : response.status >= 500 ? 'server' : 'unknown'
      const detail = body?.detail
      const message = Array.isArray(detail) ? 'The request contains invalid fields.' : typeof detail === 'string' ? detail : body?.message ?? `Request failed (${response.status})`
      throw new ApiError(message, kind, response.status, body?.errors ?? detail, body?.request_id)
    }
    if (response.status === 204) return undefined as T
    return await response.json() as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (init.signal?.aborted) throw new ApiError('Request was cancelled.', 'cancelled')
    if (timeoutController.signal.aborted) throw new ApiError('The request timed out. Please try again.', 'timeout')
    throw new ApiError(error instanceof Error ? error.message : 'Unable to reach the RADA API.', 'network')
  } finally {
    clearTimeout(timeout)
  }
}

export function apiRequest<T>(path: string, init: RequestInit = {}) { return execute<T>(path, init) }
export function apiGet<T>(path: string, query?: object, signal?: AbortSignal) { return apiRequest<T>(`${path}${buildQuery(query)}`, { method: 'GET', signal }) }
export function apiPost<T>(path: string, body?: unknown, signal?: AbortSignal) { return apiRequest<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body), signal }) }
export function apiPut<T>(path: string, body: unknown, signal?: AbortSignal) { return apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body), signal }) }
export function apiPatch<T>(path: string, body: unknown, signal?: AbortSignal) { return apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body), signal }) }
export function apiDelete<T = void>(path: string, signal?: AbortSignal) { return apiRequest<T>(path, { method: 'DELETE', signal }) }
export async function apiDownload(path: string, query?: Record<string, string | number | boolean>, signal?: AbortSignal) {
  const headers = new Headers({ Accept: 'text/csv, application/octet-stream' })
  if (appConfig.authenticationStrategy === 'bearer' && accessTokenProvider) {
    const token = await accessTokenProvider()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  const timeoutController = new AbortController()
  const timeout = setTimeout(() => timeoutController.abort(), appConfig.requestTimeoutMs)
  const requestSignal = signal ? AbortSignal.any([signal, timeoutController.signal]) : timeoutController.signal
  try {
    const response = await fetch(buildApiUrl(`${path}${buildQuery(query)}`), { signal: requestSignal, credentials: appConfig.authenticationStrategy === 'http-only-cookie' ? 'include' : 'same-origin', headers, cache: 'no-store' })
    if (!response.ok) throw new ApiError(`Download failed (${response.status})`, response.status === 401 ? 'unauthorized' : response.status === 403 ? 'forbidden' : response.status === 404 ? 'not_found' : response.status >= 500 ? 'server' : 'unknown', response.status)
    return await response.blob()
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (signal?.aborted) throw new ApiError('Request was cancelled.', 'cancelled')
    if (timeoutController.signal.aborted) throw new ApiError('The request timed out. Please try again.', 'timeout')
    throw new ApiError(error instanceof Error ? error.message : 'Unable to reach the RADA API.', 'network')
  } finally {
    clearTimeout(timeout)
  }
}
