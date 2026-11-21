import { apiDownload, apiRequest } from './http'
import type { BusinessCamera, BusinessEvent, BusinessSnapshot, Site, Tenant, TenantUser } from './development-data'

export type BusinessWorkspace = {
  tenant: Tenant
  user: TenantUser
  users: TenantUser[]
  authorizedSites: Site[]
  metrics: BusinessSnapshot[]
  cameras: BusinessCamera[]
  events: BusinessEvent[]
}

export async function fetchBusinessWorkspace(signal?: AbortSignal) {
  return apiRequest<BusinessWorkspace>('/v1/business/workspace', { signal })
}

export async function fetchBusinessReport(period: 'day' | 'week' | 'month', signal?: AbortSignal) {
  return apiDownload('/v1/business/reports', { period }, signal)
}

export async function fetchBusinessEvent(eventId: string, signal?: AbortSignal) {
  return apiRequest<BusinessEvent>(`/v1/business/events/${encodeURIComponent(eventId)}`, { signal })
}
