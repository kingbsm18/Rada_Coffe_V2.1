'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Activity, AlertTriangle, ArrowUpRight, Check, ChevronRight, CircleAlert, Pause, Play, Radio, RefreshCw, WifiOff } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { demoAlerts, demoAnalytics, demoEvents } from '@/lib/demo-data/operations'
import type { OperationsEvent, OperationalAlert } from '@/types/operations'

const reconciliationConfig = { handovers: { label: 'Physical handovers', color: 'var(--chart-1)' }, pos: { label: 'POS declared', color: 'var(--chart-2)' } }
const discrepancyConfig = { discrepancy: { label: 'Estimated discrepancy', color: 'var(--chart-3)' } }
const categoryConfig = { handovers: { label: 'Physical handovers', color: 'var(--chart-1)' }, pos: { label: 'POS declared', color: 'var(--chart-2)' } }

const numberFormatter = new Intl.NumberFormat('en-US')
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })

function formatDemoTime(timestamp: string | null) {
  return timestamp ? dateTimeFormatter.format(new Date(timestamp)) : 'Timestamp unavailable'
}

function dataForPeriod(period: string) {
  if (period === 'Today') return demoAnalytics.daily.slice(-1)
  if (period === 'Yesterday') return demoAnalytics.daily.slice(-2, -1)
  if (period === 'Custom period') return []
  return demoAnalytics.daily
}

function EventDetails({ event, onClose }: { event: OperationsEvent; onClose: () => void }) {
  return <div className="drawer-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><aside className="camera-drawer event-drawer" role="dialog" aria-modal="true" aria-labelledby="event-title"><div className="drawer-head"><div><span className="section-kicker">EVENT DETAIL{event.demo ? ' · DEMO FIXTURE' : ''}</span><h2 id="event-title">{event.type}</h2></div><button className="quiet-icon" aria-label="Close event detail" onClick={onClose}>×</button></div><div className="drawer-fields"><div><span>Establishment</span><strong>{event.establishment}</strong></div><div><span>Event type</span><strong>{event.type}</strong></div><div><span>Category</span><strong>{event.category ?? '—'}</strong></div><div><span>Quantity</span><strong>{event.quantity ?? '—'}</strong></div><div><span>Status</span><strong>{event.status.replaceAll('_', ' ')}</strong></div><div><span>Backend event time</span><strong>{formatDemoTime(event.timestamp)}</strong></div><div><span>Camera</span><strong>{event.cameraId ?? '—'}</strong></div><div><span>Event ID</span><strong>{event.id}</strong></div></div><p className="drawer-caveat">Illustrative fixture only. Operational anomalies are not proof of theft or fraud.</p></aside></div>
}

export function OperationalStatusBar({ counts, connection }: { counts: { camerasOnline: number; camerasTotal: number; edgeOnline: number; edgeTotal: number; posHealthy: number; posTotal: number; activeAlerts: number; cvIngestion: string }; connection: 'connected' | 'disconnected' }) {
  const statusItems = [
    { label: 'Cameras', value: `${counts.camerasOnline} / ${counts.camerasTotal}`, tone: counts.camerasOnline ? 'good' : 'muted' },
    { label: 'Edge devices', value: `${counts.edgeOnline} / ${counts.edgeTotal}`, tone: counts.edgeOnline ? 'good' : 'muted' },
    { label: 'POS connections', value: `${counts.posHealthy} / ${counts.posTotal}`, tone: counts.posHealthy ? 'good' : 'muted' },
    { label: 'Active alerts', value: String(counts.activeAlerts), tone: counts.activeAlerts ? 'warning' : 'good' },
    { label: 'CV ingestion', value: connection === 'connected' ? 'Connected' : 'Disconnected', tone: connection === 'connected' ? 'good' : 'muted' },
  ]
  return <section className="operational-status-bar" aria-label="Operational status"><div className="status-bar-label"><span className="status-orb disconnected" />SYSTEM STATUS</div>{statusItems.map((item) => <div className="status-bar-item" key={item.label}><span>{item.label}</span><strong className={`status-text ${item.tone}`}>{item.value}</strong></div>)}<span className="data-freshness">Last refresh · unavailable</span></section>
}

export function OperationsEventStream({ connection, events = demoEvents, demoMode = true }: { connection: 'connected' | 'disconnected'; events?: OperationsEvent[]; demoMode?: boolean }) {
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState('All events')
  const [selected, setSelected] = useState<OperationsEvent | null>(null)
  const [visibleEvents, setVisibleEvents] = useState(events)
  useEffect(() => { if (!paused) setVisibleEvents(events) }, [events, paused])
  const filtered = useMemo(() => visibleEvents.filter((event) => filter === 'All events' || (filter === 'Reconciliation' ? event.status === 'MATCHED' || event.status === 'PENDING_RECONCILIATION' || event.status === 'UNREGISTERED_HANDOVER' : event.status === 'SYNC_FAILED' || event.status === 'OFFLINE')), [filter, visibleEvents])
  return <section className="surface event-stream-panel"><div className="panel-heading-row"><div><div className="panel-title-inline"><h2>Operational event stream</h2>{demoMode && <span className="demo-label">DEMO FIXTURES</span>}</div><p>Camera, edge, POS and reconciliation events</p></div><button className={`stream-control ${paused ? 'paused' : ''}`} onClick={() => setPaused(!paused)}>{paused ? <Play size={13} /> : <Pause size={13} />}{paused ? 'Resume' : 'Pause'}</button></div><div className="stream-status-line"><span className={`stream-connection ${connection}`}><i />{connection === 'connected' ? 'Event feed connected' : 'Event feed disconnected'}</span><span>{demoMode ? 'No backend timestamps in demo mode' : 'Backend timestamps shown when received'}</span></div><label className="event-filter-label"><span className="sr-only">Filter events</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All events</option><option>Reconciliation</option><option>Infrastructure</option></select></label><div className={`event-list ${paused ? 'event-list-paused' : ''}`}>{filtered.map((event) => <button key={event.id} className="event-row" onClick={() => setSelected(event)}><span className={`event-icon ${event.status === 'MATCHED' ? 'success' : event.status === 'SYNC_FAILED' || event.status === 'OFFLINE' ? 'danger' : 'warning'}`}>{event.status === 'MATCHED' ? <Check size={14} /> : event.status === 'OFFLINE' || event.status === 'SYNC_FAILED' ? <AlertTriangle size={14} /> : <Activity size={14} />}</span><span className="event-copy"><strong>{event.type}</strong><span>{event.establishment}{event.category ? ` · ${event.category.replaceAll('_', ' ')}` : ''}</span><small>{event.quantity ? `${event.quantity} unit${event.quantity === 1 ? '' : 's'} · ` : ''}{event.status.replaceAll('_', ' ')}</small></span><span className="event-time">{event.timestamp ? timeFormatter.format(new Date(event.timestamp)) : '—'}<small>{event.timestamp ? 'BACKEND TIME' : 'NO TIME'}</small></span><ChevronRight size={14} className="event-chevron" /></button>)}{!filtered.length && <div className="empty-list">No events in this category.</div>}</div><div className="event-stream-footer"><span><WifiOff size={13} />{connection === 'connected' ? 'Waiting for backend events' : 'Awaiting event service'}</span><span>{demoMode ? 'DEMO ONLY' : 'BACKEND FEED'}</span></div>{selected && <EventDetails event={selected} onClose={() => setSelected(null)} />}</section>
}

export function ReconciliationOverview() {
  const values = [
    { label: 'Physical handovers', value: numberFormatter.format(demoAnalytics.handovers), suffix: 'units', icon: Activity },
    { label: 'POS declared', value: numberFormatter.format(demoAnalytics.posDeclared), suffix: 'units', icon: Radio },
    { label: 'Matched', value: numberFormatter.format(demoAnalytics.matched), suffix: 'units', icon: Check },
    { label: 'Unregistered', value: numberFormatter.format(demoAnalytics.unregistered), suffix: 'units', icon: CircleAlert },
    { label: 'POS without handover', value: numberFormatter.format(demoAnalytics.posWithoutHandover), suffix: 'units', icon: AlertTriangle },
    { label: 'Pending reconciliation', value: numberFormatter.format(demoAnalytics.pending), suffix: 'units', icon: RefreshCw },
    { label: 'Match rate', value: `${((demoAnalytics.matched / demoAnalytics.posDeclared) * 100).toFixed(1)}%`, suffix: 'of POS units', icon: Check },
  ]
  return <div className="reconciliation-overview">{values.map(({ label, value, suffix, icon: Icon }) => <article className="recon-stat" key={label}><span className="recon-icon"><Icon size={15} /></span><span className="recon-value">{value}<small>{suffix}</small></span><span className="recon-label">{label}</span></article>)}<article className="recon-stat estimated"><span className="recon-icon"><ArrowUpRight size={15} /></span><span className="recon-value">${demoAnalytics.estimatedDiscrepancy.toFixed(2)}</span><span className="recon-label">Estimated discrepancy</span><span className="recon-caveat">Not confirmed accounting loss</span></article></div>
}

export function HandoverVsPOSChart({ compact = false, period = 'Last 7 days' }: { compact?: boolean; period?: string }) {
  const data = dataForPeriod(period)
  return <section className="surface analytics-chart-panel"><div className="panel-heading-row"><div><h2>Physical handovers vs POS</h2><p>{period === 'Custom period' ? 'No fixture records for a custom date range' : 'Observed quantity compared with declared POS quantity'}</p></div><span className="demo-label">7-DAY FIXTURE · {period.toUpperCase()}</span></div><div className="chart-legend-row"><span><i className="legend-swatch violet" />Physical handovers</span><span><i className="legend-swatch blue" />POS declared</span></div><ChartContainer config={reconciliationConfig} className={`ops-chart ${compact ? 'compact-chart' : ''}`}><ComposedChart accessibilityLayer data={data} margin={{ left: 2, right: 7, top: 10, bottom: 0 }}><CartesianGrid vertical={false} strokeDasharray="3 4" stroke="#263247" /><XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={9} /><YAxis tickLine={false} axisLine={false} width={30} /><ChartTooltip cursor={false} content={<ChartTooltipContent />} /><Area type="monotone" dataKey="handovers" fill="var(--color-handovers)" fillOpacity={0.08} stroke="var(--color-handovers)" strokeWidth={2} /><Line type="monotone" dataKey="pos" stroke="var(--color-pos)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-pos)', strokeWidth: 0 }} /></ComposedChart></ChartContainer></section>
}

export function CategoryAnalytics({ category = 'All categories' }: { category?: string }) {
  const data = category === 'All categories' ? demoAnalytics.categories : demoAnalytics.categories.filter((item) => item.category === category)
  return <section className="surface analytics-chart-panel"><div className="panel-heading-row"><div><h2>Category-level reconciliation</h2><p>Quantity differences by product category</p></div><span className="demo-label">DEMO</span></div><ChartContainer config={categoryConfig} className="ops-chart category-chart"><BarChart data={data} layout="vertical" margin={{ left: 5, right: 14, top: 5, bottom: 0 }}><CartesianGrid horizontal={false} stroke="#263247" /><XAxis type="number" tickLine={false} axisLine={false} /><YAxis type="category" dataKey="category" width={100} tickLine={false} axisLine={false} tickFormatter={(value) => String(value).replaceAll('_', ' ')} /><ChartTooltip cursor={false} content={<ChartTooltipContent />} /><Bar dataKey="handovers" fill="var(--color-handovers)" radius={[0, 4, 4, 0]} barSize={9} /><Bar dataKey="pos" fill="var(--color-pos)" radius={[0, 4, 4, 0]} barSize={9} /></BarChart></ChartContainer><p className="chart-footnote">Differences indicate a reconciliation exception for review, not confirmed loss.</p></section>
}

export function HourlyActivityChart() {
  return <section className="surface analytics-chart-panel"><div className="panel-heading-row"><div><h2>Hourly operational activity</h2><p>Illustrative handovers by hour · local timezone unavailable</p></div><span className="demo-label">DEMO</span></div><ChartContainer config={{ handovers: { label: 'Physical handovers', color: 'var(--chart-1)' } }} className="ops-chart compact-chart"><BarChart data={demoAnalytics.hourly} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}><CartesianGrid vertical={false} strokeDasharray="3 4" stroke="#263247" /><XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} /><YAxis tickLine={false} axisLine={false} width={28} /><ChartTooltip cursor={false} content={<ChartTooltipContent />} /><Bar dataKey="handovers" fill="var(--color-handovers)" radius={[4, 4, 0, 0]} barSize={14} /></BarChart></ChartContainer></section>
}

export function DiscrepancyTrendChart({ period = 'Last 7 days' }: { period?: string }) {
  const data = dataForPeriod(period)
  return <section className="surface analytics-chart-panel"><div className="panel-heading-row"><div><h2>Estimated discrepancy trend</h2><p>{period === 'Custom period' ? 'No fixture records for a custom date range' : 'Illustrative daily variance estimate · not accounting loss'}</p></div><span className="demo-label">DEMO · {period.toUpperCase()}</span></div><ChartContainer config={discrepancyConfig} className="ops-chart compact-chart"><AreaChart data={data} margin={{ left: 4, right: 9, top: 10, bottom: 0 }}><defs><linearGradient id="discrepancyFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--color-discrepancy)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--color-discrepancy)" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} strokeDasharray="3 4" stroke="#263247" /><XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} /><YAxis tickLine={false} axisLine={false} width={32} /><Tooltip content={<ChartTooltipContent />} /><Area type="monotone" dataKey="discrepancy" stroke="var(--color-discrepancy)" fill="url(#discrepancyFill)" strokeWidth={2} /></AreaChart></ChartContainer><p className="chart-footnote">Estimated operational discrepancy is not confirmed accounting loss.</p></section>
}

export function EstablishmentComparison({ establishment = 'All establishments' }: { establishment?: string }) {
  const data = demoAnalytics.establishments.filter((item) => establishment === 'All establishments' || item.name === establishment || `Rada ${item.name}` === establishment)
  return <section className="surface establishment-panel"><div className="panel-heading-row"><div><h2>Establishment comparison</h2><p>Handover match rate by location</p></div><span className="demo-label">DEMO</span></div><div className="establishment-list">{data.map((item) => <div className="establishment-row" key={item.name}><div className="establishment-row-title"><strong>{item.name}</strong><span>{item.matched} / {item.handovers} matched</span><b>{item.rate.toFixed(1)}%</b></div><div className="progress-track"><i style={{ width: `${item.rate}%` }} /></div></div>)}</div></section>
}

export function CriticalAlertsPanel({ alerts = demoAlerts, demoMode = true }: { alerts?: OperationalAlert[]; demoMode?: boolean }) {
  const [selected, setSelected] = useState<string | null>(null)
  const alert = alerts.find((item) => item.id === selected)
  return <section className="surface critical-alert-panel"><div className="panel-heading-row"><div><div className="panel-title-inline"><h2>Critical alerts</h2><span className="alert-count">{alerts.length}</span>{demoMode && <span className="demo-label">DEMO FIXTURES</span>}</div><p>Current exceptions requiring review</p></div><Link className="panel-link" href="/superadmin/alerts">View all <ChevronRight size={13} /></Link></div><div className="critical-alert-list">{alerts.map((item) => <button className="critical-alert-row" key={item.id} onClick={() => setSelected(item.id)}><span className={`alert-severity-dot ${item.severity}`} /><span className="critical-alert-copy"><strong>{item.title}</strong><span>{item.establishment} · {item.status.replaceAll('_', ' ')}</span><small>{item.timestamp ? dateTimeFormatter.format(new Date(item.timestamp)) : 'Backend timestamp unavailable'}</small></span>{item.impact !== undefined && <span className="alert-impact">~${item.impact.toFixed(2)}<small>estimated</small></span>}<ChevronRight size={14} /></button>)}</div>{alert && <div className="alert-detail-inline"><button className="quiet-icon" aria-label="Close alert details" onClick={() => setSelected(null)}>×</button><strong>{alert.title}</strong><span>{alert.establishment} · {alert.status.replaceAll('_', ' ')}</span><small>{alert.demo ? 'Demo fixture · ' : ''}This anomaly requires review and is not proof of theft or fraud.</small></div>}</section>
}

export function InfrastructureHealthPanel({ connection }: { connection: 'connected' | 'disconnected' }) {
  const health = [
    { name: 'Camera availability', state: 'Awaiting telemetry', detail: '0 of 9 confirmed online' },
    { name: 'Edge Box availability', state: 'Awaiting telemetry', detail: '0 of 8 confirmed online' },
    { name: 'POS synchronization', state: 'Disconnected', detail: '0 of 18 confirmed healthy' },
    { name: 'CV event ingestion', state: connection === 'connected' ? 'Connected' : 'Disconnected', detail: 'No events received' },
    { name: 'Model inference', state: 'Awaiting telemetry', detail: 'Edge inference status unknown' },
    { name: 'Backend connectivity', state: connection === 'connected' ? 'Connected' : 'Disconnected', detail: 'Last update unavailable' },
  ]
  return <section className="surface infrastructure-panel"><div className="panel-heading-row"><div><h2>Infrastructure health</h2><p>Service state from authorized backend telemetry</p></div><span className="demo-label">NO LIVE TELEMETRY</span></div><div className="infrastructure-list">{health.map((item) => <div className="infrastructure-row" key={item.name}><span className={`infra-indicator ${item.state === 'Connected' ? 'connected' : 'unknown'}`} /><div><strong>{item.name}</strong><span>{item.detail}</span></div><b>{item.state}</b></div>)}</div><button className="panel-link infra-link">Open detailed monitoring <ChevronRight size={13} /></button></section>
}
