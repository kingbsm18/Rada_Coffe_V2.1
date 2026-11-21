import type { Alert, AnalyticsSummary, AuditLog, BusinessUser, Camera, CameraStream, Customer, CvDetection, EdgeDevice, Establishment, Integration, InternalUser, Page, PageRequest, PosTransaction, ReconciliationRecord, Report, Session, Subscription, SystemHealth } from '@/types/domain'
import type { PortalServices } from './contracts'
import { apiDelete, apiGet, apiPatch, apiPost, apiPut, buildQuery } from './http'
import type { BusinessWorkspace } from './business-api'
import type { ControlWorkspace } from './control-api'

export const apiServices: PortalServices = {
  auth: {
    session: async (portal, signal) => apiGet<Session | null>(`/auth/${portal}/session`, undefined, signal),
    signIn: (portal, credentials) => apiPost<Session>(`/auth/${portal}/login`, credentials),
    signOut: (portal) => apiPost<void>(`/auth/${portal}/logout`),
  },
  customers: {
    list: (query, signal) => apiGet<Page<Customer>>('/control/customers', query, signal),
    get: (id, signal) => apiGet<Customer>(`/control/customers/${encodeURIComponent(id)}`, undefined, signal),
    create: (input) => apiPost<Customer>('/control/customers', input),
    update: (id, input) => apiPatch<Customer>(`/control/customers/${encodeURIComponent(id)}`, input),
  },
  establishments: {
    list: (customerId, query, signal) => apiGet<Page<Establishment>>(`/customers/${encodeURIComponent(customerId)}/establishments`, query, signal),
    get: (id, signal) => apiGet<Establishment>(`/establishments/${encodeURIComponent(id)}`, undefined, signal),
  },
  cameras: {
    list: (establishmentId, signal) => apiGet<Camera[]>('/cameras', { establishment_id: establishmentId }, signal),
    resolveStream: (cameraId, signal) => apiPost<CameraStream>(`/cameras/${encodeURIComponent(cameraId)}/stream`, undefined, signal),
  },
  devices: { list: (establishmentId, signal) => apiGet<EdgeDevice[]>('/edge-devices', { establishment_id: establishmentId }, signal) },
  users: { list: (portal, scope, query, signal) => apiGet<Page<InternalUser | BusinessUser>>('/users', { portal, ...scope, ...query }, signal) },
  subscriptions: { list: (customerId, signal) => apiGet<Subscription[]>('/subscriptions', { customer_id: customerId }, signal), update: (id, input) => apiPatch<Subscription>(`/subscriptions/${encodeURIComponent(id)}`, input) },
  analytics: { summary: (scope, signal) => apiGet<AnalyticsSummary[]>('/analytics/summary', scope, signal) },
  cvDetections: { list: (establishmentId, query, signal) => apiGet<Page<CvDetection>>('/cv/detections', { establishment_id: establishmentId, ...query }, signal) },
  posTransactions: { list: (establishmentId, query, signal) => apiGet<Page<PosTransaction>>('/pos/transactions', { establishment_id: establishmentId, ...query }, signal) },
  reconciliation: {
    list: (scope, query, signal) => apiGet<Page<ReconciliationRecord>>(`/reconciliation${buildQuery({ ...scope, ...query })}`, undefined, signal),
    updateStatus: (id, status) => apiPatch<ReconciliationRecord>(`/reconciliation/${encodeURIComponent(id)}`, { status }),
  },
  alerts: {
    list: (scope, query, signal) => apiGet<Page<Alert>>(`/alerts${buildQuery({ ...scope, ...query })}`, undefined, signal),
    acknowledge: (id) => apiPost<Alert>(`/alerts/${encodeURIComponent(id)}/acknowledge`),
  },
  reports: {
    list: (query, signal) => apiGet<Page<Report>>('/reports', query, signal),
    download: (id, signal) => import('./http').then(({ apiDownload }) => apiDownload(`/reports/${encodeURIComponent(id)}/download`, undefined, signal)),
  },
  integrations: { list: (establishmentId, signal) => apiGet<Integration[]>('/integrations', { establishment_id: establishmentId }, signal) },
  monitoring: { health: (signal) => apiGet<SystemHealth>('/health', undefined, signal) },
  audit: { list: (query, signal) => apiGet<Page<AuditLog>>('/audit-logs', query, signal) },
}

export async function fetchControlWorkspaceAdapter(signal?: AbortSignal) { return apiGet<ControlWorkspace>('/control/workspace', undefined, signal) }
export async function fetchBusinessWorkspaceAdapter(signal?: AbortSignal) { return apiGet<BusinessWorkspace>('/business/workspace', undefined, signal) }
export async function updateCustomerAdapter(id: string, input: Partial<Customer>) { return apiPut<Customer>(`/control/customers/${encodeURIComponent(id)}`, input) }
export async function deleteCustomerAdapter(id: string) { return apiDelete<void>(`/control/customers/${encodeURIComponent(id)}`) }
export type { PageRequest }
