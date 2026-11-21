'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, Building2, Camera, Check, CircleAlert, Cpu, ExternalLink, Plus, Search, ShieldCheck, Store, Users } from 'lucide-react'
import { usePortalData } from '@/services/portal-data'
import { isDemoProvider } from '@/services/config'
import { DataConnectionNotice } from './data-connection-notice'
import { useControlWorkspace } from '@/services/portal-hooks'

const controlTitles: Record<string, { title: string; eyebrow: string; description: string }> = {
  events: { title: 'Reconciliation events', eyebrow: 'CROSS-TENANT INVESTIGATION', description: 'Investigate POS and physical handover records across customer workspaces.' },
  alerts: { title: 'Alerts & incidents', eyebrow: 'PLATFORM OPERATIONS', description: 'Prioritize customer-impacting incidents and unresolved exceptions.' },
  establishments: { title: 'Establishments', eyebrow: 'CUSTOMER OPERATIONS', description: 'Manage sites and operational readiness across every tenant.' },
  users: { title: 'Users & access', eyebrow: 'IDENTITY ADMINISTRATION', description: 'Review tenant membership and pending owner invitations.' },
  products: { title: 'Menus & products', eyebrow: 'CATALOG CONFIGURATION', description: 'Review menu configuration readiness across customer tenants.' },
  integrations: { title: 'POS & CV integrations', eyebrow: 'CONNECTIVITY', description: 'Monitor POS and computer vision integration setup.' },
  plans: { title: 'Subscriptions', eyebrow: 'CUSTOMER LIFECYCLE', description: 'Review plan assignments and onboarding status.' },
  monitoring: { title: 'Platform health', eyebrow: 'ENGINEERING OPERATIONS', description: 'Backend service health is unavailable until the RADA API is connected.' },
  devices: { title: 'Edge devices', eyebrow: 'VIDEO INFRASTRUCTURE', description: 'Review registered edge devices and their assigned sites.' },
  models: { title: 'CV model registry', eyebrow: 'MODEL OPERATIONS', description: 'Track model assignments and deployment readiness.' },
  audit: { title: 'Audit trail', eyebrow: 'SECURITY & GOVERNANCE', description: 'Administrative actions will be recorded by the RADA API.' },
  settings: { title: 'Platform settings', eyebrow: 'GLOBAL CONFIGURATION', description: 'Environment configuration and integrations for the RADA platform.' },
  support: { title: 'Support workspace', eyebrow: 'CUSTOMER SUCCESS', description: 'Tools for authorized customer support and maintenance.' },
  cameras: { title: 'Cross-customer camera wall', eyebrow: 'VIDEO OPERATIONS', description: 'Camera access is scoped to authorized endpoints; streams are not simulated.' },
}

function MetricCard({ label, value, detail, icon: Icon, tone = '' }: { label: string; value: string; detail: string; icon: typeof Building2; tone?: string }) {
  return <article className={`control-metric ${tone}`}><span className="control-metric-icon"><Icon /></span><span className="control-metric-label">{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

export function ControlDashboard() {
  const { tenants: developmentTenants, users: developmentUsers, cameras: developmentCameras, events: developmentEvents } = usePortalData()
  const development = isDemoProvider()
  const { data: workspace, error } = useControlWorkspace()
  const tenants = development ? developmentTenants : workspace?.customers ?? []
  const users = development ? developmentUsers : workspace?.users ?? []
  const cameras = development ? developmentCameras : workspace?.cameras ?? []
  const events = development ? developmentEvents : workspace?.events ?? []
  const active = tenants.filter((tenant) => tenant.status === 'Active').length
  const openEvents = events.filter((event) => event.status !== 'Resolved').length
  const tenantCount = development ? tenants.length : workspace?.overview.tenantCount
  const siteCount = development ? tenants.reduce((sum, tenant) => sum + tenant.sites.length, 0) : workspace?.overview.establishmentCount
  const incidentCount = development ? openEvents : workspace?.overview.openIncidentCount
  const cameraCount = development ? cameras.length : workspace?.overview.cameraCount
  return <div className="control-page"><DataConnectionNotice error={error} />
    <div className="control-page-heading"><div><div className="portal-eyebrow"><span /> PLATFORM OPERATIONS {isDemoProvider() && <span className="dev-caption">DEVELOPMENT FIXTURES</span>}</div><h1>Command center</h1><p>Cross-customer visibility for the RADA Coffee platform.</p></div><Link href="/control/customers/new" className="primary-action"><Plus /> Create customer</Link></div>
    <div className="control-metrics-grid"><MetricCard label="Customer tenants" value={tenantCount === undefined ? '—' : String(tenantCount).padStart(2, '0')} detail={development ? `${active} active · ${tenants.length - active} onboarding` : `${active} active · source: RADA API`} icon={Building2} /><MetricCard label="Establishments" value={siteCount === undefined ? '—' : String(siteCount).padStart(2, '0')} detail="Across authorized customer tenants" icon={Store} /><MetricCard label="Open reconciliation" value={incidentCount === undefined ? '—' : String(incidentCount).padStart(2, '0')} detail="Needs customer or support review" icon={CircleAlert} tone="metric-warning" /><MetricCard label="Camera endpoints" value={cameraCount === undefined ? '—' : String(cameraCount).padStart(2, '0')} detail={development ? 'Development assignments · no live stream' : 'Authorized endpoints · API provided'} icon={Camera} /></div>
    <div className="control-dashboard-grid">
      <section className="control-panel customer-overview-panel"><div className="control-panel-heading"><div><span className="panel-eyebrow">TENANT DIRECTORY</span><h2>Customer workspaces</h2></div><Link href="/control/customers" className="quiet-link">View all <ArrowRight /></Link></div>
        <div className="tenant-list">{tenants.slice(0, 4).map((tenant) => <Link className="tenant-row" key={tenant.id} href="/control/customers"><span className="tenant-mark">{tenant.name.slice(0, 1)}</span><span className="tenant-row-name"><strong>{tenant.name}</strong><small>{tenant.sites.length} establishments · {tenant.plan}</small></span><span className={`tenant-status ${tenant.status.toLowerCase()}`}><i />{tenant.status}</span><ArrowUpRight className="tenant-open" /></Link>)}</div>
        <div className="panel-footnote"><Users /> {users.length} customer users · owner invitations are prepared by provisioning</div>
      </section>
      <section className="control-panel platform-readiness-panel"><div className="control-panel-heading"><div><span className="panel-eyebrow">SYSTEM STATUS</span><h2>Platform readiness</h2></div><span className="status-unavailable"><i /> API disconnected</span></div>
        <div className="readiness-list"><div><span className="readiness-icon"><NetworkIcon /></span><span><strong>POS integrations</strong><small>Provider health awaits backend telemetry</small></span><em>Not connected</em></div><div><span className="readiness-icon"><Cpu /></span><span><strong>Edge fleet</strong><small>Heartbeat and version data unavailable</small></span><em>Not connected</em></div><div><span className="readiness-icon"><ShieldCheck /></span><span><strong>Identity & access</strong><small>Production authorization belongs to FastAPI</small></span><em>API required</em></div></div>
        <Link href="/control/monitoring" className="panel-action-link">Open platform health <ArrowRight /></Link>
      </section>
    </div>
    <section className="control-panel priority-panel"><div className="control-panel-heading"><div><span className="panel-eyebrow">SUPPORT QUEUE</span><h2>Priority exceptions</h2><p>Cross-tenant records in this development snapshot.</p></div><Link href="/control/events" className="quiet-link">Open event queue <ArrowRight /></Link></div>
      <div className="control-table-wrap"><table className="portal-table"><thead><tr><th>Event</th><th>Customer</th><th>Establishment</th><th>Category</th><th>Impact</th><th>Status</th></tr></thead><tbody>{events.filter((event) => event.status !== 'Resolved').slice(0, 5).map((event) => { const tenant = tenants.find((item) => item.id === event.tenantId); const site = tenant?.sites.find((item) => item.id === event.siteId); return <tr key={event.id}><td><strong>{event.id}</strong><small>{event.product}</small></td><td>{tenant?.name ?? 'Unknown tenant'}</td><td>{site?.name ?? 'Unknown site'}</td><td>{event.kind}</td><td>${event.impact.toFixed(2)}</td><td><span className={`table-status ${event.status === 'Needs review' ? 'status-attention' : 'status-pending'}`}>{event.status}</span></td></tr> })}</tbody></table></div>
    </section>
    <div className="control-footer-note"><ShieldCheck /> Internal RADA operations only. Customer-facing business workspaces use a separate route and access boundary.</div>
  </div>
}

function NetworkIcon() { return <ExternalLink /> }

export function ControlCustomersPage() {
  const { tenants: developmentTenants, users: developmentUsers } = usePortalData()
  const development = isDemoProvider()
  const { data: workspace, error } = useControlWorkspace()
  const tenants = development ? developmentTenants : workspace?.customers ?? []
  const users = development ? developmentUsers : workspace?.users ?? []
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [sort, setSort] = useState('Company name')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const filtered = useMemo(() => tenants.filter((tenant) => (status === 'All statuses' || tenant.status === status) && `${tenant.name} ${tenant.contactName} ${tenant.contactEmail} ${tenant.identifier}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'Recently added' ? (b.createdAt ?? 0) - (a.createdAt ?? 0) : a.name.localeCompare(b.name)), [tenants, status, query, sort])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visibleTenants = filtered.slice((page - 1) * pageSize, page * pageSize)
  return <div className="control-page"><DataConnectionNotice error={error} /><div className="control-page-heading"><div><div className="portal-eyebrow"><span /> CUSTOMER OPERATIONS</div><h1>Customers</h1><p>Each customer has a separate business workspace, users and establishment scope.</p></div><Link href="/control/customers/new" className="primary-action"><Plus /> Create customer</Link></div>
    <div className="directory-summary"><span><strong>{tenants.length}</strong> customer workspaces</span><span><strong>{users.filter((user) => user.status === 'Invitation pending').length}</strong> invitations pending</span>{isDemoProvider() && <span className="directory-env"><i /> Development data</span>}</div>
    <div className="directory-toolbar"><label className="directory-search"><Search /><span className="sr-only">Search customers</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search customers, contacts or IDs" /></label><label className="directory-filter">Status<select aria-label="Filter customers by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option>All statuses</option><option>Active</option><option>Onboarding</option><option>Inactive</option></select></label><label className="directory-filter">Sort by<select aria-label="Sort customers" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }}><option>Company name</option><option>Recently added</option></select></label></div>
    <div className="control-panel directory-panel"><div className="control-table-wrap"><table className="portal-table"><thead><tr><th>Customer</th><th>Company ID</th><th>Establishments</th><th>Plan</th><th>Owner contact</th><th>Status</th></tr></thead><tbody>{visibleTenants.map((tenant) => <tr key={tenant.id}><td><Link className="customer-cell-link" href={`/control/customers/${tenant.id}`}><span className="customer-cell"><span className="tenant-mark">{tenant.name.slice(0, 1)}</span><span><strong>{tenant.name}</strong><small>{tenant.id}</small></span></span></Link></td><td>{tenant.identifier || '—'}</td><td>{tenant.sites.length}</td><td>{tenant.plan}</td><td><strong>{tenant.contactName}</strong><small>{tenant.contactEmail}</small></td><td><span className={`tenant-status ${tenant.status.toLowerCase()}`}><i />{tenant.status}</span></td></tr>)}{filtered.length === 0 && <tr><td colSpan={6} className="empty-table">No customers match the current search.</td></tr>}</tbody></table></div><div className="directory-pagination"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} matches</span><span><Check /> Changes save in this browser only</span><div className="directory-page-controls"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous customer page">Previous</button><span>Page {page} of {pageCount}</span><button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page >= pageCount} aria-label="Next customer page">Next</button></div></div></div>
  </div>
}

export function ControlModulePage({ section }: { section: string }) {
  const { tenants: developmentTenants, users: developmentUsers, cameras: developmentCameras, events: developmentEvents } = usePortalData()
  const development = isDemoProvider()
  const { data: workspace, error } = useControlWorkspace()
  const tenants = development ? developmentTenants : workspace?.customers ?? []
  const users = development ? developmentUsers : workspace?.users ?? []
  const cameras = development ? developmentCameras : workspace?.cameras ?? []
  const events = development ? developmentEvents : workspace?.events ?? []
  const config = controlTitles[section] ?? { title: 'Operations workspace', eyebrow: 'RADA CONTROL', description: 'Internal platform operations and support.' }
  const rows = section === 'cameras' ? cameras.map((camera) => ({ id: camera.id, name: camera.name, tenant: tenants.find((item) => item.id === camera.tenantId)?.name ?? 'Unassigned', location: tenants.flatMap((item) => item.sites).find((site) => site.id === camera.siteId)?.name ?? 'Unassigned', status: camera.status, detail: camera.zone }))
    : section === 'events' || section === 'alerts' ? events.filter((event) => section !== 'alerts' || event.status !== 'Resolved').map((event) => ({ id: event.id, name: event.product, tenant: tenants.find((item) => item.id === event.tenantId)?.name ?? 'Unknown', location: tenants.flatMap((item) => item.sites).find((site) => site.id === event.siteId)?.name ?? 'Unknown', status: event.status, detail: event.kind }))
    : section === 'establishments' ? tenants.flatMap((tenant) => tenant.sites.map((site) => ({ id: site.id, name: site.name, tenant: tenant.name, location: site.address, status: site.status, detail: `${site.timezone} · ${site.hours}` })))
    : section === 'users' ? users.map((user) => ({ id: user.id, name: `${user.firstName} ${user.lastName}`, tenant: tenants.find((item) => item.id === user.tenantId)?.name ?? 'Unknown', location: user.siteIds.length === 1 ? tenants.flatMap((item) => item.sites).find((site) => site.id === user.siteIds[0])?.name ?? 'Assigned site' : `${user.siteIds.length} sites`, status: user.status, detail: `${user.role} · ${user.email}` }))
    : tenants.map((tenant) => ({ id: tenant.id, name: tenant.name, tenant: tenant.plan, location: tenant.sites.map((site) => site.name).join(', '), status: tenant.status, detail: tenant.contactEmail }))
  const technical = ['monitoring', 'devices', 'models', 'integrations'].includes(section)
  return <div className="control-page"><DataConnectionNotice error={error} /><div className="control-page-heading"><div><div className="portal-eyebrow"><span /> {config.eyebrow}</div><h1>{config.title}</h1><p>{config.description}</p></div>{section === 'customers' && <Link href="/control/customers/new" className="primary-action"><Plus /> Create customer</Link>}</div>
    {technical && <div className="connection-banner"><span className="banner-symbol"><NetworkIcon /></span><span><strong>Live platform connection is not configured</strong><small>This screen intentionally shows status as unavailable instead of inventing infrastructure telemetry.</small></span><Link href="/control/settings">Connection settings <ArrowRight /></Link></div>}
    {['support', 'settings', 'audit', 'products', 'plans', 'integrations', 'monitoring', 'devices', 'models'].includes(section) ? <div className="control-module-grid">{(section === 'support' ? [['Support cases', 'Customer requests are handled by the connected support service.', 'Open support guide'], ['Maintenance', 'Authorized maintenance tools will appear when the platform API is connected.', 'View platform status']] : section === 'settings' ? [['API connection', 'FastAPI owns identity, tenant administration, persistence and permissions.', 'Configure environment'], ['Session boundary', 'Control and Business sessions use separate login paths and cookie scopes.', 'Review access model']] : section === 'audit' ? [['Audit stream', 'Administrative activity is recorded by the backend; no local audit log is presented as authoritative.', 'API required'], ['Export history', 'Audit exports become available when the authorized service is connected.', 'API required']] : section === 'products' ? [['Menu configuration', 'Menu and category data is scoped to the selected customer tenant.', 'Open customers'], ['Import status', 'Menu imports are not run in this development preview.', 'API required']] : section === 'plans' ? [['Subscription catalog', 'Plan definitions and billing status belong to the backend billing service.', 'API required'], ['Provisioning', 'A plan can be assigned during customer onboarding.', 'Create customer']] : [['Service connection', 'Health checks and telemetry are not simulated in development fixtures.', 'API required'], ['Tenant mappings', 'Configuration is isolated by customer and establishment scope.', 'View customers']]).map(([heading, text, label]) => <article className="control-panel module-info-card" key={heading}><span className="module-info-icon"><Cpu /></span><h2>{heading}</h2><p>{text}</p><span className="module-card-state"><i /> Not connected</span><Link href={label === 'Create customer' ? '/control/customers/new' : label === 'Open customers' || label === 'View customers' ? '/control/customers' : '/control/settings'}>{label}<ArrowRight /></Link></article>)}</div> : <section className="control-panel module-table-panel"><div className="control-panel-heading"><div><span className="panel-eyebrow">{rows.length} RECORDS</span><h2>{section === 'cameras' ? 'Authorized endpoints' : section === 'events' || section === 'alerts' ? 'Event records' : section === 'establishments' ? 'Site directory' : 'Tenant access records'}</h2></div></div><div className="control-table-wrap"><table className="portal-table"><thead><tr><th>Record</th><th>Tenant</th><th>Establishment / scope</th><th>Status</th><th>Details</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.id}</strong><small>{row.name}</small></td><td>{row.tenant}</td><td>{row.location}</td><td><span className={`table-status ${row.status === 'Online' || row.status === 'Active' || row.status === 'Resolved' ? 'status-good' : 'status-attention'}`}>{row.status}</span></td><td>{row.detail}</td></tr>)}</tbody></table></div>{rows.length === 0 && <p className="empty-state">No records are available in this development workspace.</p>}</section>}
    <div className="control-footer-note"><ShieldCheck /> RADA Control is internal-only. Authorization and all cross-tenant data access must be enforced by FastAPI.</div>
  </div>
}
