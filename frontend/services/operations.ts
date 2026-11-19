import type { Camera, OperationsEvent, OperationsSnapshot } from '@/types/operations'

const apiBase = process.env.NEXT_PUBLIC_OPERATIONS_API_URL?.replace(/\/$/, '')

export function isOperationsApiConfigured() {
  return Boolean(apiBase)
}

export async function fetchOperationsSnapshot(signal?: AbortSignal): Promise<OperationsSnapshot> {
  if (!apiBase) throw new Error('Operations API is not configured')
  const response = await fetch(`${apiBase}/v1/operations/snapshot`, {
    signal,
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Operations API returned ${response.status}`)
  return response.json() as Promise<OperationsSnapshot>
}

export function subscribeToOperationsEvents(
  onEvent: (event: OperationsEvent) => void,
  onState: (state: 'connected' | 'disconnected') => void,
) {
  if (!apiBase || typeof EventSource === 'undefined') {
    onState('disconnected')
    return () => undefined
  }

  const source = new EventSource(`${apiBase}/v1/operations/events`)
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
