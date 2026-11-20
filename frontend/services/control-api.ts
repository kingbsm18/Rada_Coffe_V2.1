import { apiRequest } from './http'
import type { ProvisionCustomerInput, Tenant } from './development-data'

export type ControlOverview = {
  tenantCount: number
  establishmentCount: number
  openIncidentCount: number
  cameraCount: number
  updatedAt: string
}

export type ControlWorkspace = {
  overview: ControlOverview
  customers: Tenant[]
  users: import('./development-data').TenantUser[]
  cameras: import('./development-data').BusinessCamera[]
  events: import('./development-data').BusinessEvent[]
}

export async function fetchControlWorkspace(signal?: AbortSignal) {
  return apiRequest<ControlWorkspace>('/v1/control/workspace', { signal })
}

export async function fetchControlOverview(signal?: AbortSignal) {
  return apiRequest<ControlOverview>('/v1/control/overview', { signal })
}

export async function fetchControlCustomers(signal?: AbortSignal) {
  return apiRequest<Tenant[]>('/v1/control/customers', { signal })
}

export async function provisionControlCustomer(input: ProvisionCustomerInput) {
  return apiRequest<Tenant>('/v1/control/customers/provision', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
