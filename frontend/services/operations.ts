import type { Camera, OperationsEvent, OperationsSnapshot } from '@/types/operations'
import { appConfig, isApiConfigured, isApiProvider } from './config'
import { apiGet, buildApiUrl } from './http'

export function isOperationsApiConfigured() {
  return isApiProvider()
}

export async function fetchOperationsSnapshot(signal?: AbortSignal): Promise<OperationsSnapshot> {
  if (!isApiConfigured()) throw new Error('API mode is selected, but NEXT_PUBLIC_RADA_API_URL is not configured.')
  return apiGet<OperationsSnapshot>('/v1/operations/snapshot', undefined, signal)
}

export function subscribeToOperationsEvents(
  onEvent: (event: OperationsEvent) => void,
  onState: (state: 'connected' | 'disconnected') => void,
) {
  if (!isApiConfigured() || !appConfig.features.realtime || appConfig.authenticationStrategy !== 'http-only-cookie' || typeof EventSource === 'undefined') {
    onState('disconnected')
    return () => undefined
  }

  const source = new EventSource(buildApiUrl('/operations/events'), { withCredentials: true })
  source.onopen = () => onState('connected')
  source.onerror = () => onState('disconnected')
  source.addEventListener('operations-event', (message) => {
    try {
      onEvent(JSON.parse((message as MessageEvent<string>).data) as OperationsEvent)
    } catch {
      onState('disconnected')
    }
  })
  return () => source.close()
}

export function resolveAuthorizedPreview(camera: Camera) {
  // The backend may provide a short-lived, authorized preview endpoint. RTSP credentials never belong in this client.
  return camera.previewEndpoint ?? null
}
