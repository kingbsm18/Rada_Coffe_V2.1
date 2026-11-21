'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ArrowRight, ArrowUpRight, CalendarDays, Camera, Check, ChevronDown, CircleAlert, Clock3, Download, MapPin, Maximize2, PackageCheck, Search, ShieldAlert, Store, TrendingUp, X } from 'lucide-react'
import { canSeeFinancials, roleCanAccess, usePortalData } from '@/services/portal-data'
import { isDemoProvider } from '@/services/config'
import { DataConnectionNotice } from './data-connection-notice'
import type { BusinessEvent } from '@/services/development-data'
import { useBusinessWorkspace } from '@/services/portal-hooks'
import { usePortalSession } from '@/services/portal-session'

const businessContent: Record<string, { title: string; eyebrow: string; description: string }> = {
  cameras: { title: 'Live cameras', eyebrow: 'YOUR OPERATIONS', description: 'View authorized camera endpoints at the establishments assigned to your account.' },
  analytics: { title: 'Operational analytics', eyebrow: 'PERFORMANCE', description: 'Understand handovers, POS registration and reconciliation across your authorized sites.' },
  reconciliation: { title: 'POS / handover reconciliation', eyebrow: 'EVENT REVIEW', description: 'Compare observed physical handovers with POS records that need attention.' },
  alerts: { title: 'Alerts & anomalies', eyebrow: 'ATTENTION REQUIRED', description: 'Review operational exceptions for your assigned establishments.' },
  reports: { title: 'Reports', eyebrow: 'BUSINESS REPORTING', description: 'Review and export operational summaries for your authorized workspace.' },
  establishments: { title: 'Establishments', eyebrow: 'YOUR LOCATIONS', description: 'View the sites belonging to your company and the access assigned to your account.' },
  team: { title: 'Team & access', eyebrow: 'PEOPLE', description: 'Manage or review customer-side workspace access.' },
  settings: { title: 'Account settings', eyebrow: 'WORKSPACE', description: 'Company and subscription information for your customer workspace.' },
}

function Metric({ label, value, note, icon: Icon, warning = false }: { label: string; value: string; note: string; icon: typeof Activity; warning?: boolean }) {
  return <article className={`business-metric ${warning ? 'business-metric-warning' : ''}`}><span className="business-metric-icon"><Icon /></span><span className="business-metric-label">{label}</span><strong>{value}</strong><small>{note}</small></article>
}

function ScopeNotice() {
  const development = isDemoProvider()
  return <div className="business-dev-note"><span><i /> {development ? 'DEVELOPMENT WORKSPACE' : 'CUSTOMER DATA'}</span><p>{development ? 'Fixture values are illustrative; no live camera feed or production business data is connected.' : 'Business records are limited to the authenticated customer and assigned establishments.'}</p></div>
}

function useBusinessRecords() {
  const development = isDemoProvider()
  const { session } = usePortalSession('business')
  const { tenants, users: developmentUsers, cameras: developmentCameras, events: developmentEvents, snapshots: developmentSnapshots, activeTenantId, activeSiteId, setActiveSiteId, updateEventStatus } = usePortalData()
  const { data: workspace, error, isLoading } = useBusinessWorkspace()
  const tenantId = development ? session?.user.tenantId : undefined
  const tenant = development ? tenants.find((item) => item.id === tenantId) : workspace?.tenant
  const businessUser = development
    ? developmentUsers.find((item) => item.id === session?.user.id && item.tenantId === tenantId) ?? developmentUsers.find((item) => item.tenantId === tenantId && item.role === 'OWNER')
    : workspace?.user
  const user = development && session?.user.id.startsWith('dev-preview-') && businessUser
    ? { ...businessUser, firstName: 'RADA', lastName: 'Support' }
    : businessUser
  const siteIds = development
    ? user?.role === 'OWNER' ? tenant?.sites.map((site) => site.id) ?? [] : user?.siteIds ?? []
    : workspace?.authorizedSites.map((site) => site.id) ?? []
  const allSites = development ? tenant?.sites ?? [] : workspace?.authorizedSites ?? []
  const visibleSites = allSites.filter((site) => siteIds.includes(site.id) && (activeSiteId === 'all' || site.id === activeSiteId))
  const allowedSiteIds = new Set(visibleSites.map((site) => site.id))
  const snapshots = development ? developmentSnapshots : workspace?.metrics ?? []
  const cameras = development ? developmentCameras : workspace?.cameras ?? []
  const events = development ? developmentEvents : workspace?.events ?? []
  const scopeTenantId = development ? tenantId : tenant?.id ?? activeTenantId
  const snapshotRows = snapshots.filter((snapshot) => scopeTenantId && snapshot.tenantId === scopeTenantId && allowedSiteIds.has(snapshot.siteId))
  const handovers = snapshotRows.reduce((sum, snapshot) => sum + snapshot.handovers, 0)
  const metrics = {
    posRegistered: snapshotRows.reduce((sum, snapshot) => sum + snapshot.posRegistered, 0),
    handovers,
    matchRate: handovers ? snapshotRows.reduce((sum, snapshot) => sum + snapshot.matchRate * snapshot.handovers, 0) / handovers : 0,
    unregisteredHandovers: snapshotRows.reduce((sum, snapshot) => sum + snapshot.unregisteredHandovers, 0),
    discrepancy: snapshotRows.reduce((sum, snapshot) => sum + snapshot.discrepancy, 0),
  }
  return {
    tenant, user, users: development ? developmentUsers : workspace?.users ?? [], visibleSites, metrics, setActiveSiteId,
    snapshots: snapshotRows,
    cameras: cameras.filter((camera) => camera.tenantId === scopeTenantId && allowedSiteIds.has(camera.siteId)),
    events: events.filter((event) => event.tenantId === scopeTenantId && allowedSiteIds.has(event.siteId)),
    loading: !development && isLoading,
    error: development ? null : error,
    resolveEvent: (eventId: string) => { if (development && tenantId) updateEventStatus(tenantId, eventId, 'Resolved') },
  }
}

export function BusinessDashboard() {
  const { tenant, user, visibleSites, events, metrics, snapshots, cameras, setActiveSiteId, error } = useBusinessRecords()
  const attention = events.filter((event) => event.status !== 'Resolved')
  const companyOverviewAccess = user?.role === 'OWNER' || user?.role === 'COMPANY_EXECUTIVE' || Boolean(user?.permissions?.includes('business:establishments:read'))
  const canReconcile = roleCanAccess(user?.role ?? 'STAFF', 'reconciliation', user?.permissions)
  const canViewReports = roleCanAccess(user?.role ?? 'STAFF', 'reports', user?.permissions)
  const financialAccess = canSeeFinancials(user?.role ?? 'STAFF', user?.permissions)
  const variance = metrics.handovers - metrics.posRegistered
  return <div className="business-page">
    <div className="business-page-heading"><div><div className="business-eyebrow"><span /> {tenant?.name ?? 'BUSINESS WORKSPACE'} <span className="business-date"><CalendarDays /> Current snapshot</span></div><h1>Good morning{user?.firstName ? `, ${user.firstName}` : ''}</h1><p>{visibleSites.length > 1 ? `Your overview across ${visibleSites.length} authorized establishments.` : `Here’s what’s happening at ${visibleSites[0]?.name ?? 'your establishment'} today.`}</p></div>{canViewReports && <Link className="business-outline-action" href="/business/reports"><Download /> Reports</Link>}</div>
    <ScopeNotice /><DataConnectionNotice error={error} />
    <div className="business-metrics-grid"><Metric label="Match rate" value={`${metrics.matchRate.toFixed(1)}%`} note="POS and handover records aligned" icon={TrendingUp} /><Metric label="Unregistered handovers" value={String(metrics.unregisteredHandovers)} note="Requires reconciliation" icon={CircleAlert} warning /><Metric label={financialAccess ? 'Estimated discrepancy' : 'Open items'} value={financialAccess ? `$${metrics.discrepancy.toFixed(2)}` : String(attention.length)} note={financialAccess ? 'Illustrative local estimate' : 'Requires review'} icon={financialAccess ? CircleAlert : Activity} /></div>
    <div className="business-dashboard-grid">
      <section className="business-card business-activity-card"><div className="business-card-heading"><div><span className="business-card-kicker">RECONCILIATION SNAPSHOT</span><h2>POS vs physical handovers</h2></div><Link href={canReconcile ? '/business/reconciliation' : '/business/alerts'}>{canReconcile ? 'Review records' : 'View alerts'} <ArrowRight /></Link></div><div className="snapshot-comparison"><div><span>POS registered</span><strong>{metrics.posRegistered.toLocaleString()}</strong></div><span className="snapshot-vs">vs</span><div><span>Observed handovers</span><strong>{metrics.handovers.toLocaleString()}</strong></div></div><div className={`snapshot-variance ${variance === 0 ? 'balanced' : 'unmatched'}`}><strong>{Math.abs(variance)} unmatched by count</strong><span>{variance > 0 ? 'Observed handovers exceed POS entries' : variance < 0 ? 'POS entries exceed observed handovers' : 'Counts currently aligned'} · compare event records to investigate</span></div></section>
      <section className="business-card attention-card"><div className="business-card-heading"><div><span className="business-card-kicker">NEEDS YOUR ATTENTION</span><h2>{attention.length} open item{attention.length === 1 ? '' : 's'}</h2></div><span className="attention-count">{attention.length}</span></div><div className="attention-list">{attention.slice(0, 3).map((event) => <EventRow key={event.id} event={event} tenant={tenant?.name ?? ''} siteName={visibleSites.find((site) => site.id === event.siteId)?.name ?? ''} href={canReconcile ? `/business/reconciliation?event=${event.id}` : '/business/alerts'} />)}</div><Link className="business-card-footer-link" href="/business/alerts">Open alert center <ArrowRight /></Link></section>
    </div>
    {companyOverviewAccess && visibleSites.length > 1 && <section className="business-card site-comparison"><div className="business-card-heading"><div><span className="business-card-kicker">COMPANY OVERVIEW</span><h2>Establishment performance</h2></div><Link href="/business/establishments">Manage locations <ArrowRight /></Link></div><div className="site-performance-list">{visibleSites.map((site) => { const siteMetrics = snapshots.find((snapshot) => snapshot.siteId === site.id); return <div className="site-performance-row" key={site.id}><span className="site-mini-mark"><Store /></span><span className="site-performance-name"><strong>{site.name}</strong><small><MapPin /> {site.address}</small></span><span className="site-performance-value"><strong>{siteMetrics ? `${siteMetrics.matchRate.toFixed(1)}%` : '—'}</strong><small>Match rate</small></span><span className="site-performance-value"><strong>{siteMetrics?.handovers ?? '—'}</strong><small>Handovers</small></span><button className="site-scope-action" onClick={() => setActiveSiteId(site.id)} aria-label={`Filter dashboard to ${site.name}`}><ArrowUpRight /></button></div> })}</div></section>}
    <div className="business-dashboard-bottom"><section className="business-card camera-preview-card"><div className="business-card-heading"><div><span className="business-card-kicker">AUTHORIZED VIEWS</span><h2>Camera overview</h2></div><Link href="/business/cameras">View cameras <ArrowRight /></Link></div><div className="camera-preview-grid">{visibleSites.slice(0, 2).map((site) => { const siteCamera = cameras.find((camera) => camera.siteId === site.id); return <Link key={site.id} href="/business/cameras" className="camera-preview"><span className="camera-preview-image"><Camera /><small>{siteCamera ? 'PREVIEW NOT CONNECTED' : 'NO CAMERA ASSIGNED'}</small>{siteCamera && <b>{siteCamera.status.toUpperCase()}</b>}</span><strong>{siteCamera?.name ?? 'Camera setup'}</strong><small>{site.name}</small></Link> })}</div></section><section className="business-card activity-timeline-card"><div className="business-card-heading"><div><span className="business-card-kicker">LATEST EVENTS</span><h2>Recent activity</h2></div><Link href="/business/reconciliation">View all <ArrowRight /></Link></div><div className="business-timeline">{events.slice(0, 4).map((event) => <EventRow key={event.id} event={event} tenant={tenant?.name ?? ''} siteName={visibleSites.find((site) => site.id === event.siteId)?.name ?? ''} compact />)}</div></section></div>
  </div>
}

function EventRow({ event, siteName, tenant, compact = false, href }: { event: BusinessEvent; siteName: string; tenant: string; compact?: boolean; href?: string }) {
  return <Link className={`business-event-row ${compact ? 'compact' : ''}`} href={href ?? `/business/reconciliation?event=${event.id}`}><span className={`event-indicator ${event.status === 'Resolved' ? 'event-good' : event.status === 'Pending' ? 'event-pending' : 'event-attention'}`}><Activity /></span><span className="business-event-copy"><strong>{event.kind}</strong><small>{event.product} · {siteName || tenant}</small></span><span className="business-event-time">{event.time}</span></Link>
}

function CameraGallery({ density, onDensityChange }: { density: number; onDensityChange: (density: number) => void }) {
  const { cameras, visibleSites } = useBusinessRecords()
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const [full, setFull] = useState(false)
  const drawerRef = useRef<HTMLElement | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (selectedCamera) drawerRef.current?.focus()
    else openerRef.current?.focus()
  }, [selectedCamera])
  function closeDrawer() { setSelectedCamera(null); setFull(false) }
  function handleDrawerKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') { event.preventDefault(); closeDrawer(); return }
    if (event.key !== 'Tab') return
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled])'))
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  const [zone, setZone] = useState('All zones')
  const [query, setQuery] = useState('')
  const selected = cameras.find((camera) => camera.id === selectedCamera)
  const cameraSites = new Map(visibleSites.map((site) => [site.id, site.name]))
  const filtered = cameras.filter((camera) => (zone === 'All zones' || camera.zone === zone) && `${camera.name} ${camera.zone} ${camera.id}`.toLowerCase().includes(query.toLowerCase())).slice(0, density)
  return <><div className="camera-module-toolbar"><label className="business-search"><Search /><input aria-label="Search authorized cameras" placeholder="Search cameras" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="camera-zone-filter"><span className="sr-only">Filter by zone</span><select aria-label="Filter cameras by zone" value={zone} onChange={(event) => setZone(event.target.value)}><option>All zones</option>{Array.from(new Set(cameras.map((camera) => camera.zone))).map((item) => <option key={item}>{item}</option>)}</select><ChevronDown /></label><div className="camera-density" aria-label="Camera grid density">{[4, 9, 16].map((count) => <button type="button" key={count} className={density === count ? 'active' : ''} onClick={() => onDensityChange(count)}>{Math.sqrt(count)}×{Math.sqrt(count)}</button>)}</div><span className="camera-auth-note"><ShieldAlert /> Authorized sites only</span></div>
    <div className="business-camera-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(4, Math.sqrt(density)))}, minmax(0, 1fr))` }}>{filtered.map((camera) => <button className="business-camera-card" key={camera.id} onClick={(event) => { openerRef.current = event.currentTarget; setSelectedCamera(camera.id) }}><span className="business-camera-stage"><Camera /><span className="camera-stage-message">Preview not connected</span><span className={`camera-live-status ${camera.status.toLowerCase()}`}><i />{camera.status}</span><span className="camera-last-frame">Last frame · {camera.lastFrame}</span><span className="camera-card-expand"><Maximize2 /></span></span><span className="business-camera-caption"><strong>{camera.name}</strong><small>{cameraSites.get(camera.siteId)} · {camera.zone}</small></span></button>)}{filtered.length === 0 && <div className="business-empty-state">No authorized cameras match these filters.</div>}</div>
    {selected && <div className={`business-camera-overlay ${full ? 'is-fullscreen' : ''}`} role="presentation" onClick={(event) => { if (event.target === event.currentTarget) closeDrawer() }}><section ref={drawerRef} tabIndex={-1} onKeyDown={handleDrawerKeyDown} className="business-camera-drawer" role="dialog" aria-modal="true" aria-labelledby="camera-detail-title" aria-describedby="camera-detail-description"><div className="drawer-title-row"><div><span className="business-card-kicker">CAMERA DETAIL</span><h2 id="camera-detail-title">{selected.name}</h2></div><div className="drawer-actions"><button onClick={() => setFull(!full)} aria-label={full ? 'Exit fullscreen camera view' : 'View camera fullscreen'}><Maximize2 /></button><button onClick={closeDrawer} aria-label="Close camera detail"><X /></button></div></div><div className="camera-detail-view"><Camera /><strong>Authorized preview unavailable</strong><span id="camera-detail-description">No live stream is configured for this development workspace.</span></div><dl className="camera-detail-list"><div><dt>Establishment</dt><dd>{cameraSites.get(selected.siteId)}</dd></div><div><dt>Zone</dt><dd>{selected.zone}</dd></div><div><dt>Health</dt><dd>{selected.status}</dd></div><div><dt>Last authorized frame</dt><dd>{selected.lastFrame}</dd></div></dl><p className="camera-security-note">Stream credentials are never exposed in the browser. FastAPI authorizes viewer access and issues secure preview URLs.</p></section></div>}
  </>
}

export function BusinessModulePage({ section }: { section: string }) {
  const { tenant, user, users, visibleSites, cameras, events, metrics, error, resolveEvent } = useBusinessRecords()
  const development = isDemoProvider()
  const [density, setDensity] = useState(4)
  const [selectedEvent, setSelectedEvent] = useState<BusinessEvent | null>(null)
  const [category, setCategory] = useState('All categories')
  const config = businessContent[section] ?? { title: 'Business workspace', eyebrow: 'YOUR BUSINESS', description: 'Operational details from your authorized customer workspace.' }
  const canAccess = roleCanAccess(user?.role ?? 'STAFF', section, user?.permissions)
  const financialAccess = canSeeFinancials(user?.role ?? 'STAFF', user?.permissions)
  const filteredEvents = useMemo(() => events.filter((event) => (category === 'All categories' || event.kind === category)), [events, category])
  const variance = metrics.handovers - metrics.posRegistered
  const exceptionBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    events.filter((event) => event.status !== 'Resolved').forEach((event) => counts.set(event.kind, (counts.get(event.kind) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [events])
  if (!canAccess) return <div className="business-page"><div className="business-page-heading"><div><div className="business-eyebrow"><span /> ACCESS CONTROL</div><h1>This area isn’t available</h1><p>Your current role does not include access to {config.title.toLowerCase()}.</p></div></div><div className="business-card access-denied-card"><ShieldAlert /><div><strong>Access is permission-scoped</strong><p>Only your organization’s administrator can grant additional access. This preview hides restricted business data from this role.</p></div></div></div>
  return <div className="business-page"><div className="business-page-heading"><div><div className="business-eyebrow"><span /> {tenant?.name ?? 'BUSINESS WORKSPACE'} <span className="business-date"><Store /> {visibleSites.length} authorized location{visibleSites.length === 1 ? '' : 's'}</span></div><h1>{config.title}</h1><p>{config.description}</p></div>{section === 'reports' && <button className="business-outline-action" onClick={() => exportReport(events, tenant?.name ?? 'RADA')}><Download /> Export CSV</button>}</div><ScopeNotice /><DataConnectionNotice error={error} />
    {section === 'cameras' && <section className="business-card business-module-card"><div className="business-card-heading"><div><span className="business-card-kicker">{cameras.length} CAMERA ENDPOINTS</span><h2>Authorized camera grid</h2></div><span className="camera-no-stream"><i /> No live streams connected</span></div><CameraGallery density={density} onDensityChange={setDensity} /></section>}
    {section === 'analytics' && <div className="business-analytics-overview"><section className="business-card analytics-summary-card"><div className="business-card-heading"><div><span className="business-card-kicker">CURRENT WORKSPACE SNAPSHOT</span><h2>POS and handover reconciliation</h2></div><span className="analytics-scope">{visibleSites.length} authorized location{visibleSites.length === 1 ? '' : 's'}</span></div><p className="analytics-data-note">Historical time-series data is not available in this local preview. These values reflect the current development snapshot.</p><div className="reconciliation-comparison"><div><span>POS registered</span><strong>{metrics.posRegistered.toLocaleString()}</strong></div><span className="comparison-divider" aria-hidden="true">vs</span><div><span>Physical handovers</span><strong>{metrics.handovers.toLocaleString()}</strong></div><div className={`comparison-variance ${variance === 0 ? 'balanced' : 'unmatched'}`}><span>Unmatched count</span><strong>{Math.abs(variance).toLocaleString()}</strong><small>{variance > 0 ? 'More handovers than POS records' : variance < 0 ? 'More POS records than handovers' : 'Counts currently aligned'}</small></div></div>{financialAccess && <div className="analytics-financial-note"><span>Estimated discrepancy</span><strong>${metrics.discrepancy.toFixed(2)}</strong><small>Illustrative local value · not accounting data</small></div>}</section><section className="business-card analytics-exceptions-card"><div className="business-card-heading"><div><span className="business-card-kicker">REVIEW QUEUE</span><h2>Open items by category</h2></div><Link href="/business/reconciliation">Review records <ArrowRight /></Link></div>{exceptionBreakdown.length ? <div className="analytics-exception-list">{exceptionBreakdown.map(([kind, count]) => <div key={kind}><span>{kind}</span><strong>{count}</strong></div>)}</div> : <p className="analytics-data-note">No open reconciliation items for this workspace.</p>}</section></div>}
    {(section === 'reconciliation' || section === 'alerts' || section === 'reports') && <section className="business-card business-module-card"><div className="business-card-heading"><div><span className="business-card-kicker">{filteredEvents.length} RECORDS · {tenant?.name ?? 'WORKSPACE'}</span><h2>{section === 'alerts' ? 'Open operational exceptions' : section === 'reports' ? 'Operational report records' : 'Recent reconciliation activity'}</h2></div>{section !== 'reports' && <label className="camera-zone-filter"><span className="sr-only">Filter event categories</span><select aria-label="Filter event category" value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option><option>Unregistered handover</option><option>Pending reconciliation</option><option>Matched</option><option>POS not handed over</option></select><ChevronDown /></label>}</div><div className="business-table-wrap"><table className="business-table"><thead><tr><th>Event</th><th>Establishment</th><th>Product</th><th>Quantity</th><th>Time</th>{financialAccess && <th>Est. impact</th>}<th>Status</th><th /></tr></thead><tbody>{filteredEvents.filter((event) => section !== 'alerts' || event.status !== 'Resolved').map((event) => <tr key={event.id}><td><button className="table-record-link" onClick={() => setSelectedEvent(event)}>{event.id}<small>{event.kind}</small></button></td><td>{visibleSites.find((site) => site.id === event.siteId)?.name}</td><td>{event.product}</td><td>{event.quantity}</td><td>{event.time}</td>{financialAccess && <td>{event.impact ? `$${event.impact.toFixed(2)}` : '—'}</td>}<td><span className={`business-event-status ${event.status.toLowerCase().replace(' ', '-')}`}>{event.status}</span></td><td><div className="event-row-actions"><button className="table-open-button" aria-label={`Open details for ${event.id}`} onClick={() => setSelectedEvent(event)}><ArrowUpRight /></button>{section === 'alerts' && development && event.status !== 'Resolved' && <button type="button" className="table-resolve-button" onClick={() => resolveEvent(event.id)}>Resolve</button>}</div></td></tr>)}</tbody></table></div>{selectedEvent && <EventDetail event={selectedEvent} siteName={visibleSites.find((site) => site.id === selectedEvent.siteId)?.name ?? ''} showImpact={financialAccess} onClose={() => setSelectedEvent(null)} />}</section>}
    {section === 'establishments' && <section className="business-site-list">{visibleSites.map((site) => <article className="business-card business-site-card" key={site.id}><span className="business-site-icon"><Store /></span><span className="business-site-info"><strong>{site.name}</strong><small><MapPin /> {site.address}</small></span><span className="site-live-pill"><i /> {site.status}</span><span className="business-site-meta"><small>Operating hours</small><strong>{site.hours}</strong></span><span className="business-site-meta"><small>Timezone</small><strong>{site.timezone}</strong></span><Link href={`/business/dashboard?site=${site.id}`} aria-label={`View dashboard for ${site.name}`}><ArrowUpRight /></Link></article>)}</section>}
    {section === 'team' && <section className="business-card business-module-card"><div className="business-card-heading"><div><span className="business-card-kicker">CUSTOMER MEMBERS</span><h2>Team access</h2></div><span className="business-event-status pending">Invitation management requires the RADA API</span></div><div className="business-table-wrap"><table className="business-table"><thead><tr><th>Team member</th><th>Role</th><th>Establishment access</th><th>Status</th></tr></thead><tbody>{users.filter((member) => member.tenantId === tenant?.id).map((member) => <tr key={member.id}><td><strong>{member.firstName} {member.lastName}</strong><small>{member.email}</small></td><td>{member.role}</td><td>{member.role === 'OWNER' ? 'All company locations' : visibleSites.filter((site) => member.siteIds.includes(site.id)).map((site) => site.name).join(', ') || 'Assigned locations'}</td><td><span className="business-event-status pending">{member.status}</span></td></tr>)}</tbody></table></div></section>}
    {section === 'settings' && <section className="business-settings-grid"><article className="business-card settings-overview"><span className="business-card-kicker">COMPANY PROFILE</span><h2>{tenant?.name}</h2><p>Customer workspace details managed by your organization administrator.</p><dl className="camera-detail-list"><div><dt>Business identifier</dt><dd>{tenant?.identifier || 'Not provided'}</dd></div><div><dt>Primary contact</dt><dd>{tenant?.contactName}</dd></div><div><dt>Contact email</dt><dd>{tenant?.contactEmail}</dd></div><div><dt>Subscription</dt><dd>{tenant?.plan}</dd></div></dl></article><article className="business-card settings-overview"><span className="business-card-kicker">DATA & PRIVACY</span><h2>Your workspace boundary</h2><p>Business records are scoped by your authenticated customer identity and establishment permissions.</p><div className="privacy-highlight"><ShieldAlert /><span><strong>Tenant isolation is enforced by FastAPI</strong><small>This frontend does not treat hidden navigation as an authorization boundary.</small></span></div><Link href="mailto:support@radacoffee.example" className="settings-support-link">Contact support <ArrowRight /></Link></article></section>}
  </div>
}

function EventDetail({ event, siteName, showImpact, onClose }: { event: BusinessEvent; siteName: string; showImpact: boolean; onClose: () => void }) {
  return <div className="event-detail-panel"><div><span className="business-card-kicker">EVENT DETAIL · {event.id}</span><button onClick={onClose} aria-label="Close event detail"><X /></button></div><h3>{event.kind}</h3><p>{event.quantity} × {event.product} at {siteName} · {event.time}</p><div className="event-detail-meta"><span>Status<strong>{event.status}</strong></span>{showImpact && <span>Estimated impact<strong>${event.impact.toFixed(2)}</strong></span>}</div><p className="business-card-footnote">Evidence and camera footage are only available to accounts with explicit evidence permissions.</p></div>
}

function exportReport(events: BusinessEvent[], companyName: string) {
  const lines = [['Event ID', 'Type', 'Product', 'Quantity', 'Time', 'Status'], ...events.map((event) => [event.id, event.kind, event.product, String(event.quantity), event.time, event.status])]
  const csv = lines.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${companyName.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}-operations-report.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
