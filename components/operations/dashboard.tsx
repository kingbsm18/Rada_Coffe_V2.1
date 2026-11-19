'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Building2, CalendarDays, Camera as CameraIcon, ChevronDown, Clock3, Radio, Search, Users } from 'lucide-react'
import { OperationsShell } from '@/components/layout/operations-shell'
import { CriticalAlertsPanel, HandoverVsPOSChart, InfrastructureHealthPanel, OperationalStatusBar, OperationsEventStream, ReconciliationOverview } from '@/components/operations/operations-panels'
import { LiveCameraPlayer } from '@/components/operations/camera-workspace'
import type { Camera } from '@/types/operations'
import { demoSnapshot } from '@/lib/demo-data/operations'
import { useOperationsFeed } from '@/components/operations/use-operations-feed'

type Connection = 'connected' | 'disconnected'

export default function OperationsDashboard() {
  const feed = useOperationsFeed()
  const connection = feed.connection
  const snapshot = feed.snapshot ?? { ...demoSnapshot, cameras: [], events: [], alerts: [], counts: { ...demoSnapshot.counts, camerasOnline: 0, camerasTotal: 0, edgeOnline: 0, edgeTotal: 0, posHealthy: 0, posTotal: 0, activeAlerts: 0 } }
  const [establishment, setEstablishment] = useState('All establishments')
  const [period, setPeriod] = useState('Last 7 days')
  const [customer, setCustomer] = useState('All customers')
  const [cameraQuery, setCameraQuery] = useState('')
  const [cameraDensity, setCameraDensity] = useState(4)

  return <OperationsShell><main className="ops-content dashboard-ops">
    <div className="ops-heading dashboard-heading"><div><div className="section-kicker"><span className="kicker-rule" />AI OPERATIONS <span className="demo-label">{feed.demoMode ? 'DEMO MODE · FIXTURE DATA' : feed.isLoading ? 'LOADING BACKEND DATA' : feed.error ? 'BACKEND UNAVAILABLE' : 'BACKEND DATA'}</span></div><h1>Operations Command Center</h1><p>Real-time visibility across RADA Coffee establishments.</p></div><div className="monitoring-state"><span className={`status-orb ${connection}`} />{connection === 'connected' ? 'Live feed connected' : 'Monitoring disconnected'}<span className="monitoring-divider" />Last refresh · unavailable</div></div>
    <div className="scope-toolbar"><label><Users size={14} /><select value={customer} onChange={(event) => setCustomer(event.target.value)} aria-label="Select customer"><option>All customers</option><option>Rada Coffee</option><option>Cedar & Stone</option></select></label><label><Building2 size={14} /><select value={establishment} onChange={(event) => setEstablishment(event.target.value)} aria-label="Select establishment"><option>All establishments</option>{Array.from(new Set(snapshot.cameras.map((camera) => camera.establishment))).map((name) => <option key={name}>{name}</option>)}</select></label><label><CalendarDays size={14} /><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Select date range"><option>Today</option><option>Yesterday</option><option>Last 7 days</option><option>Last 30 days</option><option>Custom period</option></select></label><span className="scope-spacer" /><span className="scope-source"><Radio size={13} />{feed.demoMode ? 'API not configured' : feed.error ? 'Backend unreachable' : connection === 'connected' ? 'Event stream connected' : 'API configured · waiting for data'}</span></div>
    <OperationalStatusBar counts={snapshot.counts} connection={connection} />
    <div className="primary-ops-grid"><section className="surface camera-wall-panel"><div className="panel-heading-row camera-wall-heading"><div><div className="panel-title-inline"><CameraIcon size={16} /><h2>Live camera wall</h2><span className="demo-label">{feed.demoMode ? 'DEMO PREVIEW · STREAM NOT CONNECTED' : 'CAMERA PREVIEWS · AUTHORIZED ENDPOINT ONLY'}</span></div><p>Edge-processed camera status and authorized preview feeds</p></div><div className="camera-wall-actions"><div className="density-controls">{[4, 9, 16].map((count) => <button key={count} className={cameraDensity === count ? 'selected' : ''} onClick={() => setCameraDensity(count)} aria-label={`${Math.sqrt(count)} by ${Math.sqrt(count)} camera layout`}>{Math.sqrt(count)}×{Math.sqrt(count)}</button>)}</div><Link href="/superadmin/cameras">View all cameras <ChevronDown size={13} /></Link></div></div><div className="inline-camera-toolbar"><label className="camera-search"><Search size={14} /><input value={cameraQuery} onChange={(event) => setCameraQuery(event.target.value)} placeholder="Search cameras" aria-label="Search dashboard cameras" /></label><select value={establishment} onChange={(event) => setEstablishment(event.target.value)} aria-label="Filter camera establishment"><option>All establishments</option>{Array.from(new Set(snapshot.cameras.map((camera) => camera.establishment))).map((name) => <option key={name}>{name}</option>)}</select><span className="camera-wall-subnote">{snapshot.cameras.length} {feed.demoMode ? 'fixture cameras' : 'authorized cameras'} · frames {connection === 'connected' ? 'per camera' : 'unavailable'}</span></div><CameraWorkspacePreview cameras={snapshot.cameras} establishment={establishment} customer={customer} query={cameraQuery} density={cameraDensity} /></section>
      <OperationsEventStream connection={connection} events={feed.events} demoMode={feed.demoMode} />
    </div>
    <section className="business-intelligence"><div className="section-heading-row"><div><div className="section-kicker"><span className="kicker-rule" />REVENUE INTELLIGENCE</div><h2>POS / computer vision reconciliation</h2><p>Operational quantity variance for review · data shown is illustrative only</p></div><Link className="text-link" href="/superadmin/analytics">Open full analytics <ChevronDown size={13} /></Link></div><ReconciliationOverview /><div className="dashboard-chart-grid"><HandoverVsPOSChart compact period={period} /><div className="surface discrepancy-callout"><div className="callout-title"><Clock3 size={15} />Estimated financial discrepancy</div><strong>${384.50}<small> illustrative estimate</small></strong><p>Observed and POS-declared quantities differ in these fixture records. This estimate is not confirmed accounting loss and requires reconciliation.</p><span className="demo-label">DEMO FIXTURES · 7 DAYS</span><Link href="/superadmin/analytics">Review discrepancy detail <ChevronDown size={12} /></Link></div></div></section>
    <div className="secondary-ops-grid"><CriticalAlertsPanel alerts={snapshot.alerts} demoMode={feed.demoMode} /><InfrastructureHealthPanel connection={connection} /></div>
    <footer className="ops-footer"><span>RADA COFFEE INTELLIGENCE</span><span><i />{connection === 'connected' ? 'Backend event stream connected' : 'No live backend connection'} · Updated time unavailable</span></footer>
  </main></OperationsShell>
}

function CameraWorkspacePreview({ cameras: allCameras, establishment, customer, query, density }: { cameras: Camera[]; establishment: string; customer: string; query: string; density: number }) {
  const cameras = allCameras.filter((camera) => (establishment === 'All establishments' || camera.establishment === establishment) && (customer === 'All customers' || (customer === 'Cedar & Stone' ? camera.establishment === customer : camera.establishment !== 'Cedar & Stone')) && `${camera.name} ${camera.id} ${camera.zone} ${camera.establishment} ${camera.edgeDevice}`.toLowerCase().includes(query.toLowerCase())).slice(0, density)
  return <div className="dashboard-camera-grid">{cameras.map((camera) => <article className="dashboard-camera-tile" key={camera.id}><div className="dashboard-camera-viewport"><LiveCameraPlayer camera={camera} /><Link href="/superadmin/cameras" className="tile-expand" aria-label={`Open ${camera.name} in camera operations`}><CameraIcon size={14} /></Link></div><div className="dashboard-camera-meta"><div><strong>{camera.name}</strong><span>{camera.establishment} · {camera.zone}</span></div><span>{camera.edgeDevice}</span></div></article>)}{!cameras.length && <div className="camera-no-results">{query ? 'No cameras match your search.' : 'No cameras are available for this scope.'}</div>}</div>
}
