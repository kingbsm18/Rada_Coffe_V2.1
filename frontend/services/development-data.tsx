'use client'

import { isDemoProvider } from './config'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type Site = {
  id: string
  tenantId: string
  name: string
  address: string
  timezone: string
  status: 'Active' | 'Onboarding' | 'Inactive'
  hours: string
}

export type OnboardingConfig = { posProvider: string; cvIntegration: string; edgeBox: string; cameraSetup: string; menuImport: string }

export type Tenant = {
  id: string
  createdAt?: number
  name: string
  identifier: string
  status: 'Active' | 'Onboarding' | 'Inactive'
  contactName: string
  contactEmail: string
  phone: string
  address: string
  plan: string
  renewalDate: string
  subscriptionStartDate?: string
  subscriptionStatus?: 'Trial' | 'Active' | 'Past due' | 'Cancelled'
  provisioningStatus?: 'Ready' | 'In progress' | 'Blocked'
  onboardingConfig?: OnboardingConfig
  sites: Site[]
}

export type TenantUser = {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  email: string
  role: 'OWNER' | 'COMPANY_EXECUTIVE' | 'MANAGER' | 'OPERATIONS_MANAGER' | 'ESTABLISHMENT_MANAGER' | 'STAFF'
  permissions?: string[]
  siteIds: string[]
  status: 'Active' | 'Invitation pending'
}

export type BusinessCamera = {
  id: string
  tenantId: string
  siteId: string
  name: string
  zone: string
  status: 'Online' | 'Degraded' | 'Offline'
  lastFrame: string
}

export type BusinessEvent = {
  id: string
  tenantId: string
  siteId: string
  kind: 'Unregistered handover' | 'Pending reconciliation' | 'Matched' | 'POS not handed over'
  product: string
  quantity: number
  time: string
  impact: number
  status: 'Needs review' | 'Resolved' | 'Pending'
}

export type BusinessSnapshot = {
  tenantId: string
  siteId: string
  posRegistered: number
  handovers: number
  matchRate: number
  unregisteredHandovers: number
  discrepancy: number
}

export type ProvisionCustomerInput = {
  companyName: string
  identifier: string
  contactName: string
  contactEmail: string
  phone: string
  address: string
  status: Tenant['status']
  sites: Array<Pick<Site, 'name' | 'address' | 'timezone' | 'hours' | 'status'>>
  owner: Pick<TenantUser, 'firstName' | 'lastName' | 'email' | 'role' | 'siteIds'>
  plan: string
  startDate: string
  renewalDate: string
  onboardingConfig: OnboardingConfig
}

type DevelopmentDataContextValue = {
  tenants: Tenant[]
  users: TenantUser[]
  cameras: BusinessCamera[]
  events: BusinessEvent[]
  snapshots: BusinessSnapshot[]
  activeTenantId: string
  activeSiteId: string
  selectedUserId: string
  setActiveTenantId: (id: string) => void
  setActiveSiteId: (id: string) => void
  setSelectedUserId: (id: string) => void
  createCustomer: (input: ProvisionCustomerInput) => Tenant
  updateCustomer: (id: string, patch: Partial<Omit<Tenant, 'id' | 'sites'>>) => void
  deleteCustomer: (id: string) => void
  setCustomerStatus: (id: string, status: Tenant['status']) => void
  addEstablishment: (tenantId: string, input: Omit<Site, 'id' | 'tenantId'>) => void
  updateEstablishment: (tenantId: string, siteId: string, patch: Partial<Omit<Site, 'id' | 'tenantId'>>) => void
  deleteEstablishment: (tenantId: string, siteId: string) => void
  addCustomerUser: (tenantId: string, input: Omit<TenantUser, 'id' | 'tenantId'>) => void
  updateCustomerUser: (tenantId: string, userId: string, patch: Partial<Omit<TenantUser, 'id' | 'tenantId'>>) => void
  addCamera: (tenantId: string, input: Omit<BusinessCamera, 'id' | 'tenantId'>) => void
  updateCamera: (tenantId: string, cameraId: string, patch: Partial<Omit<BusinessCamera, 'id' | 'tenantId'>>) => void
  deleteCamera: (tenantId: string, cameraId: string) => void
  updateEventStatus: (tenantId: string, eventId: string, status: BusinessEvent['status']) => void
}

const radaSites: Site[] = [
  { id: 'site-rada-downtown', tenantId: 'tenant-rada', name: 'RADA Downtown', address: '214 King Street, Toronto, ON', timezone: 'America/Toronto', status: 'Active', hours: '07:00–21:00' },
  { id: 'site-rada-west', tenantId: 'tenant-rada', name: 'RADA West End', address: '88 Ossington Avenue, Toronto, ON', timezone: 'America/Toronto', status: 'Active', hours: '07:00–20:00' },
]
const cedarSites: Site[] = [
  { id: 'site-cedar-market', tenantId: 'tenant-cedar', name: 'Cedar & Stone Market', address: '37 Front Street, Toronto, ON', timezone: 'America/Toronto', status: 'Active', hours: '08:00–19:00' },
]

const developmentTenants: Tenant[] = [
  { id: 'tenant-rada', name: 'RADA Coffee', identifier: 'CA-819-441-208', status: 'Active', contactName: 'Alex Morgan', contactEmail: 'alex@radacoffee.example', phone: '+1 416 555 0138', address: '214 King Street, Toronto, ON', plan: 'Growth · 5 sites', renewalDate: '2027-03-01', sites: radaSites },
  { id: 'tenant-cedar', name: 'Cedar & Stone', identifier: 'CA-208-771-946', status: 'Active', contactName: 'Jordan Lee', contactEmail: 'jordan@cedarstone.example', phone: '+1 416 555 0197', address: '37 Front Street, Toronto, ON', plan: 'Starter · 2 sites', renewalDate: '2027-01-15', sites: cedarSites },
]

const developmentUsers: TenantUser[] = [
  { id: 'user-rada-owner', tenantId: 'tenant-rada', firstName: 'Alex', lastName: 'Morgan', email: 'alex@radacoffee.example', role: 'OWNER', siteIds: radaSites.map((site) => site.id), status: 'Active' },
  { id: 'user-rada-manager', tenantId: 'tenant-rada', firstName: 'Sam', lastName: 'Rivera', email: 'sam@radacoffee.example', role: 'MANAGER', siteIds: [radaSites[0].id], status: 'Active' },
  { id: 'user-rada-staff', tenantId: 'tenant-rada', firstName: 'Taylor', lastName: 'Chen', email: 'taylor@radacoffee.example', role: 'STAFF', siteIds: [radaSites[0].id], status: 'Active' },
  { id: 'user-cedar-owner', tenantId: 'tenant-cedar', firstName: 'Jordan', lastName: 'Lee', email: 'jordan@cedarstone.example', role: 'OWNER', siteIds: cedarSites.map((site) => site.id), status: 'Active' },
]

const developmentCameras: BusinessCamera[] = [
  { id: 'CAM-101', tenantId: 'tenant-rada', siteId: 'site-rada-downtown', name: 'Service counter', zone: 'Handover zone', status: 'Online', lastFrame: 'Just now' },
  { id: 'CAM-102', tenantId: 'tenant-rada', siteId: 'site-rada-downtown', name: 'Pickup shelf', zone: 'Collection zone', status: 'Online', lastFrame: 'Just now' },
  { id: 'CAM-201', tenantId: 'tenant-rada', siteId: 'site-rada-west', name: 'West counter', zone: 'Handover zone', status: 'Degraded', lastFrame: '2 min ago' },
  { id: 'CAM-301', tenantId: 'tenant-cedar', siteId: 'site-cedar-market', name: 'Market counter', zone: 'Handover zone', status: 'Online', lastFrame: 'Just now' },
]

const developmentEvents: BusinessEvent[] = [
  { id: 'EVT-4582', tenantId: 'tenant-rada', siteId: 'site-rada-downtown', kind: 'Unregistered handover', product: 'Oat latte · large', quantity: 2, time: '10:42 AM', impact: 13.5, status: 'Needs review' },
  { id: 'EVT-4579', tenantId: 'tenant-rada', siteId: 'site-rada-west', kind: 'Pending reconciliation', product: 'Cold brew', quantity: 1, time: '10:35 AM', impact: 5.25, status: 'Pending' },
  { id: 'EVT-4571', tenantId: 'tenant-rada', siteId: 'site-rada-downtown', kind: 'Matched', product: 'Flat white', quantity: 1, time: '10:21 AM', impact: 0, status: 'Resolved' },
  { id: 'EVT-4568', tenantId: 'tenant-rada', siteId: 'site-rada-downtown', kind: 'POS not handed over', product: 'Almond croissant', quantity: 1, time: '10:14 AM', impact: 4.75, status: 'Needs review' },
  { id: 'EVT-3194', tenantId: 'tenant-cedar', siteId: 'site-cedar-market', kind: 'Pending reconciliation', product: 'Espresso tonic', quantity: 1, time: '10:28 AM', impact: 6.5, status: 'Pending' },
]

const developmentSnapshots: BusinessSnapshot[] = [
  { tenantId: 'tenant-rada', siteId: 'site-rada-downtown', posRegistered: 96, handovers: 104, matchRate: 96.4, unregisteredHandovers: 4, discrepancy: 221.45 },
  { tenantId: 'tenant-rada', siteId: 'site-rada-west', posRegistered: 76, handovers: 80, matchRate: 91.8, unregisteredHandovers: 4, discrepancy: 163.05 },
  { tenantId: 'tenant-cedar', siteId: 'site-cedar-market', posRegistered: 68, handovers: 72, matchRate: 94.4, unregisteredHandovers: 2, discrepancy: 129.2 },
]

const DevelopmentDataContext = createContext<DevelopmentDataContextValue | null>(null)

const STORAGE_KEY = 'rada-development-data-v1'

type StoredDevelopmentData = { version: 1; tenants: Tenant[]; users: TenantUser[]; cameras: BusinessCamera[]; events: BusinessEvent[]; snapshots: BusinessSnapshot[] }

function parseStoredDevelopmentData(value: string | null): StoredDevelopmentData | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as Partial<StoredDevelopmentData>
    if (parsed.version === 1 && Array.isArray(parsed.tenants) && Array.isArray(parsed.users) && Array.isArray(parsed.cameras) && Array.isArray(parsed.events) && Array.isArray(parsed.snapshots)) return parsed as StoredDevelopmentData
  } catch { /* Invalid local data is ignored and the development seed remains available. */ }
  return null
}

export function DevelopmentDataProvider({ children }: { children: React.ReactNode }) {
  const demo = isDemoProvider()
  const [tenants, setTenants] = useState<Tenant[]>(demo ? developmentTenants : [])
  const [users, setUsers] = useState<TenantUser[]>(demo ? developmentUsers : [])
  const [cameras, setCameras] = useState<BusinessCamera[]>(demo ? developmentCameras : [])
  const [events, setEvents] = useState<BusinessEvent[]>(demo ? developmentEvents : [])
  const [snapshots, setSnapshots] = useState<BusinessSnapshot[]>(demo ? developmentSnapshots : [])
  const [activeTenantId, setActiveTenantId] = useState('tenant-rada')
  const [activeSiteId, setActiveSiteId] = useState('all')
  const [selectedUserId, setSelectedUserId] = useState('user-rada-owner')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!demo) { setHydrated(true); return }
    try {
      const stored = parseStoredDevelopmentData(window.localStorage.getItem(STORAGE_KEY))
      if (stored) {
        setTenants(stored.tenants)
        setUsers(stored.users)
        setCameras(stored.cameras)
        setEvents(stored.events)
        setSnapshots(stored.snapshots)
      } else if (window.localStorage.getItem(STORAGE_KEY)) {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    } catch { /* Storage may be unavailable in a restricted browser context. */ } finally {
      setHydrated(true)
    }
  }, [demo])

  useEffect(() => {
    if (!demo) return
    function synchronizeAcrossTabs(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      const stored = parseStoredDevelopmentData(event.newValue)
      if (!stored) return
      setTenants(stored.tenants)
      setUsers(stored.users)
      setCameras(stored.cameras)
      setEvents(stored.events)
      setSnapshots(stored.snapshots)
    }
    window.addEventListener('storage', synchronizeAcrossTabs)
    return () => window.removeEventListener('storage', synchronizeAcrossTabs)
  }, [demo])

  useEffect(() => {
    if (!demo || !hydrated) return
    const data: StoredDevelopmentData = { version: 1, tenants, users, cameras, events, snapshots }
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* Storage can be disabled or full; the in-memory workspace remains usable. */ }
  }, [demo, hydrated, tenants, users, cameras, events, snapshots])

  const createCustomer = useCallback((input: ProvisionCustomerInput) => {
    const tenantId = `tenant-${crypto.randomUUID()}`
    const sites = input.sites.map((site, index) => ({ ...site, id: `${tenantId}-site-${index + 1}`, tenantId }))
    const tenant: Tenant = {
      id: tenantId, createdAt: Date.now(), name: input.companyName.trim(), identifier: input.identifier.trim(), status: input.status,
      contactName: input.contactName.trim(), contactEmail: input.contactEmail.trim(), phone: input.phone.trim(), address: input.address.trim(),
      plan: input.plan, subscriptionStartDate: input.startDate, renewalDate: input.renewalDate, subscriptionStatus: 'Trial', provisioningStatus: 'In progress', onboardingConfig: input.onboardingConfig, sites,
    }
    const owner: TenantUser = {
      id: `${tenantId}-owner`, tenantId, firstName: input.owner.firstName.trim(), lastName: input.owner.lastName.trim(), email: input.owner.email.trim(),
      role: input.owner.role, siteIds: sites.filter((site, index) => input.owner.siteIds.includes(input.sites[index].name)).map((site) => site.id), status: 'Invitation pending',
    }
    setTenants((current) => [...current, tenant])
    setUsers((current) => [...current, owner])
    return tenant
  }, [])

  const updateCustomer = useCallback((id: string, patch: Partial<Omit<Tenant, 'id' | 'sites'>>) => {
    setTenants((current) => current.map((tenant) => tenant.id === id ? { ...tenant, ...patch } : tenant))
  }, [])

  const deleteCustomer = useCallback((id: string) => {
    setTenants((current) => current.filter((tenant) => tenant.id !== id))
    setUsers((current) => current.filter((user) => user.tenantId !== id))
    setCameras((current) => current.filter((camera) => camera.tenantId !== id))
    setEvents((current) => current.filter((event) => event.tenantId !== id))
    setSnapshots((current) => current.filter((snapshot) => snapshot.tenantId !== id))
    if (activeTenantId === id) { setActiveTenantId(''); setActiveSiteId('all'); setSelectedUserId('') }
  }, [activeTenantId])

  const setCustomerStatus = useCallback((id: string, status: Tenant['status']) => {
    setTenants((current) => current.map((tenant) => tenant.id === id ? { ...tenant, status } : tenant))
  }, [])

  const addEstablishment = useCallback((tenantId: string, input: Omit<Site, 'id' | 'tenantId'>) => {
    const site: Site = { ...input, id: `site-${crypto.randomUUID()}`, tenantId }
    setTenants((current) => current.map((tenant) => tenant.id === tenantId ? { ...tenant, sites: [...tenant.sites, site] } : tenant))
  }, [])

  const updateEstablishment = useCallback((tenantId: string, siteId: string, patch: Partial<Omit<Site, 'id' | 'tenantId'>>) => {
    setTenants((current) => current.map((tenant) => tenant.id === tenantId ? { ...tenant, sites: tenant.sites.map((site) => site.id === siteId ? { ...site, ...patch } : site) } : tenant))
  }, [])

  const deleteEstablishment = useCallback((tenantId: string, siteId: string) => {
    setTenants((current) => current.map((tenant) => tenant.id === tenantId ? { ...tenant, sites: tenant.sites.filter((site) => site.id !== siteId) } : tenant))
    setUsers((current) => current.map((user) => user.tenantId === tenantId ? { ...user, siteIds: user.siteIds.filter((id) => id !== siteId) } : user))
    setCameras((current) => current.filter((camera) => camera.siteId !== siteId))
    setEvents((current) => current.filter((event) => event.siteId !== siteId))
    setSnapshots((current) => current.filter((snapshot) => snapshot.siteId !== siteId))
    if (activeSiteId === siteId) setActiveSiteId('all')
  }, [activeSiteId])

  const addCustomerUser = useCallback((tenantId: string, input: Omit<TenantUser, 'id' | 'tenantId'>) => {
    setUsers((current) => [...current, { ...input, id: `user-${crypto.randomUUID()}`, tenantId }])
  }, [])

  const updateCustomerUser = useCallback((tenantId: string, userId: string, patch: Partial<Omit<TenantUser, 'id' | 'tenantId'>>) => {
    setUsers((current) => current.map((user) => user.tenantId === tenantId && user.id === userId ? { ...user, ...patch } : user))
  }, [])

  const addCamera = useCallback((tenantId: string, input: Omit<BusinessCamera, 'id' | 'tenantId'>) => {
    setCameras((current) => [...current, { ...input, id: `CAM-${crypto.randomUUID()}`, tenantId }])
  }, [])

  const updateCamera = useCallback((tenantId: string, cameraId: string, patch: Partial<Omit<BusinessCamera, 'id' | 'tenantId'>>) => {
    setCameras((current) => current.map((camera) => camera.tenantId === tenantId && camera.id === cameraId ? { ...camera, ...patch } : camera))
  }, [])

  const deleteCamera = useCallback((tenantId: string, cameraId: string) => {
    setCameras((current) => current.filter((camera) => camera.tenantId !== tenantId || camera.id !== cameraId))
  }, [])

  const updateEventStatus = useCallback((tenantId: string, eventId: string, status: BusinessEvent['status']) => {
    setEvents((current) => current.map((event) => event.tenantId === tenantId && event.id === eventId ? { ...event, status } : event))
  }, [])

  const value = useMemo(() => ({ tenants, users, cameras, events, snapshots, activeTenantId, activeSiteId, selectedUserId, setActiveTenantId, setActiveSiteId, setSelectedUserId, createCustomer, updateCustomer, deleteCustomer, setCustomerStatus, addEstablishment, updateEstablishment, deleteEstablishment, addCustomerUser, updateCustomerUser, addCamera, updateCamera, deleteCamera, updateEventStatus }), [tenants, users, cameras, events, snapshots, activeTenantId, activeSiteId, selectedUserId, createCustomer, updateCustomer, deleteCustomer, setCustomerStatus, addEstablishment, updateEstablishment, deleteEstablishment, addCustomerUser, updateCustomerUser, addCamera, updateCamera, deleteCamera, updateEventStatus])
  return <DevelopmentDataContext.Provider value={value}>{children}</DevelopmentDataContext.Provider>
}

export function useDevelopmentData() {
  const context = useContext(DevelopmentDataContext)
  if (!context) throw new Error('useDevelopmentData must be used inside DevelopmentDataProvider')
  return context
}

export function roleCanAccess(role: TenantUser['role'], module: string, permissions?: string[]) {
  if (permissions) return permissions.includes('business:*') || permissions.includes(`business:${module}:read`)
  if (role === 'OWNER' || role === 'COMPANY_EXECUTIVE') return true
  if (role === 'MANAGER' || role === 'OPERATIONS_MANAGER') return !['team', 'settings'].includes(module)
  if (role === 'ESTABLISHMENT_MANAGER') return ['dashboard', 'cameras', 'analytics', 'reconciliation', 'alerts', 'reports'].includes(module)
  return ['dashboard', 'cameras', 'alerts'].includes(module)
}

export function canSeeFinancials(role: TenantUser['role'], permissions?: string[]) {
  return permissions ? permissions.includes('business:financials:read') : role === 'OWNER' || role === 'COMPANY_EXECUTIVE'
}

