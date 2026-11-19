'use client'

import { useMemo, useRef, useState } from 'react'
import { Activity, Building2, CheckCircle2, ChevronRight, CircleAlert, Clock3, Expand, Filter, Maximize2, MoreHorizontal, Search, Settings2, Signal, Video, X } from 'lucide-react'
import { resolveAuthorizedPreview } from '@/services/operations'
import { useOperationsFeed } from '@/components/operations/use-operations-feed'
import type { Camera, CameraConnectionState } from '@/types/operations'

const statusTone: Record<CameraConnectionState, string> = {
  LIVE: 'live', CONNECTING: 'connecting', RECONNECTING: 'connecting', DEGRADED: 'degraded', OFFLINE: 'offline', NO_SIGNAL: 'offline', DEMO: 'demo',
}

export function CameraStatusIndicator({ state }: { state: CameraConnectionState }) {
  return <span className={`camera-status-badge ${statusTone[state]}`}><i />{state === 'DEMO' ? 'DEMO' : state.replace('_', ' ')}</span>
}

export function LiveCameraPlayer({ camera, large = false }: { camera: Camera; large?: boolean }) {
  const endpoint = resolveAuthorizedPreview(camera)
  return <div className={`live-player ${large ? 'live-player-large' : ''}`}>
    {endpoint ? <video className="authorized-video" src={endpoint} controls muted playsInline aria-label={`Authorized video preview for ${camera.name}`} /> : <div className="stream-disconnected"><Video size={large ? 28 : 22} strokeWidth={1.4} /><strong>{camera.state === 'DEMO' ? 'DEMO PREVIEW' : 'VIDEO PREVIEW UNAVAILABLE'}</strong><span>STREAM NOT CONNECTED</span><small>No camera footage is being received.</small></div>}
    <div className="player-overlay-top"><CameraStatusIndicator state={camera.state} /><span className="player-zone">{camera.zone}</span></div>
    <div className="player-overlay-bottom"><span><i />{camera.id}</span><span>Frame time unavailable</span></div>
  </div>
}

function CameraCard({ camera, onSelect, onFullscreen }: { camera: Camera; onSelect: () => void; onFullscreen: (node: HTMLElement | null) => void }) {
  const cardRef = useRef<HTMLElement>(null)
  return <article className="ops-camera-card" ref={cardRef}>
    <div className="camera-card-player"><LiveCameraPlayer camera={camera} /><button className="camera-expand-button" aria-label={`Expand ${camera.name}`} onClick={() => onFullscreen(cardRef.current)}><Maximize2 size={14} /></button></div>
    <div className="ops-camera-info"><div className="ops-camera-title"><div><h3>{camera.name}</h3><span>{camera.establishment}</span></div><button className="quiet-icon" aria-label={`More options for ${camera.name}`}><MoreHorizontal size={17} /></button></div><div className="ops-camera-meta"><span><Signal size={12} />{camera.edgeDevice}</span><span><Activity size={12} />{camera.model}</span></div><button className="camera-details-link" onClick={onSelect}>Camera details <ChevronRight size={13} /></button></div>
  </article>
}

function CameraDetailsDrawer({ camera, onClose }: { camera: Camera; onClose: () => void }) {
  return <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><aside className="camera-drawer" role="dialog" aria-modal="true" aria-labelledby="camera-drawer-title"><div className="drawer-head"><div><span className="section-kicker">CAMERA DETAILS{camera.state === 'DEMO' ? ' · DEMO FIXTURE' : ''}</span><h2 id="camera-drawer-title">{camera.name}</h2></div><button className="quiet-icon" aria-label="Close camera details" onClick={onClose}><X size={18} /></button></div><LiveCameraPlayer camera={camera} large /><div className="drawer-status-row"><CameraStatusIndicator state={camera.state} /><span>Connection telemetry unavailable</span></div><div className="drawer-fields"><div><span>Establishment</span><strong>{camera.establishment}</strong></div><div><span>Zone</span><strong>{camera.zone}</strong></div><div><span>Camera ID</span><strong>{camera.id}</strong></div><div><span>Associated Edge Box</span><strong>{camera.edgeDevice}</strong></div><div><span>Active CV model</span><strong>{camera.model}</strong></div><div><span>Last frame</span><strong>Unavailable · stream disconnected</strong></div></div><section className="drawer-section"><h3>Detection zones</h3><div className="zone-pills">{camera.detectionZones.map((zone) => <span key={zone}>{zone}</span>)}</div></section><section className="drawer-section"><h3>Recent detections</h3><div className="drawer-empty"><Clock3 size={17} /><span>{camera.latestEvent ?? 'No events received from backend.'}</span><small>Backend event time unavailable</small></div></section>  </aside></div>
}

export function CameraWorkspace() {
  const { snapshot, configured, isLoading } = useOperationsFeed()
  const cameras = snapshot?.cameras ?? []
  const connectedCount = cameras.filter((camera) => camera.state === 'LIVE').length
  const offlineCount = cameras.filter((camera) => camera.state === 'OFFLINE' || camera.state === 'NO_SIGNAL').length
  const degradedCount = cameras.filter((camera) => camera.state === 'DEGRADED').length
  const [density, setDensity] = useState(4)
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [establishment, setEstablishment] = useState('All establishments')
  const [stateFilter, setStateFilter] = useState('All cameras')
  const [selected, setSelected] = useState<Camera | null>(null)
  const filteredCameras = useMemo(() => cameras.filter((camera) => `${camera.name} ${camera.id} ${camera.zone} ${camera.establishment}`.toLowerCase().includes(search.toLowerCase()) && (establishment === 'All establishments' || camera.establishment === establishment) && (stateFilter === 'All cameras' || camera.state === stateFilter)), [cameras, search, establishment, stateFilter])
  const fullscreen = async (node: HTMLElement | null) => { if (node?.requestFullscreen) await node.requestFullscreen().catch(() => undefined) }
  const establishments = Array.from(new Set(cameras.map((camera) => camera.establishment)))

  return <main className="ops-content camera-workspace">
    <div className="ops-heading"><div><div className="section-kicker"><span className="kicker-rule" />VIDEO OPERATIONS <span className="demo-label">{configured ? isLoading ? 'LOADING BACKEND DATA' : 'BACKEND DATA' : 'DEMO FIXTURES'}</span></div><h1>Camera Operations</h1><p>Inspect camera coverage and edge associations across establishments.</p></div><button className="outline-action" onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')}><Expand size={14} />{layout === 'grid' ? 'List view' : 'Grid view'}</button></div>
    <div className="camera-summary-row"><div className="summary-chip"><Video size={15} /><span>Connected</span><strong>{connectedCount} <small>/ {cameras.length}</small></strong></div><div className="summary-chip warn"><CircleAlert size={15} /><span>Offline</span><strong>{offlineCount}</strong></div><div className="summary-chip warn"><Signal size={15} /><span>Degraded</span><strong>{degradedCount}</strong></div><div className="summary-chip summary-connection"><i />Backend connection<span>{configured ? snapshot ? 'Connected' : 'Waiting for data' : 'Disconnected'}</span></div></div>
    <div className="camera-toolbar"><label className="camera-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search cameras, zones, Edge Box..." aria-label="Search cameras" /></label><label className="toolbar-select"><Building2 size={14} /><select value={establishment} onChange={(event) => setEstablishment(event.target.value)} aria-label="Filter establishment"><option>All establishments</option>{establishments.map((item) => <option key={item}>{item}</option>)}</select></label><label className="toolbar-select"><Filter size={14} /><select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} aria-label="Filter camera status"><option>All cameras</option><option value="DEMO">Demo preview</option><option value="LIVE">Live</option><option value="OFFLINE">Offline</option></select></label><div className="toolbar-spacer" /><div className="density-controls" aria-label="Camera grid density">{[4, 9, 16].map((count) => <button key={count} className={density === count ? 'selected' : ''} onClick={() => setDensity(count)} aria-label={`${Math.sqrt(count)} by ${Math.sqrt(count)} camera grid`}>{Math.sqrt(count)}×{Math.sqrt(count)}</button>)}</div><button className="quiet-icon" aria-label="Camera settings"><Settings2 size={16} /></button></div>
    <div className="wall-note"><CircleAlert size={14} /><span>Development preview only. No video is being received; no sample photographs or fabricated footage are shown.</span></div>
    <section className={`ops-camera-wall ${layout === 'list' ? 'camera-list-layout' : ''}`} style={{ '--camera-columns': layout === 'list' ? 1 : Math.sqrt(density) } as React.CSSProperties} aria-label="Camera wall">
      {filteredCameras.slice(0, density).map((camera) => <CameraCard key={camera.id} camera={camera} onSelect={() => setSelected(camera)} onFullscreen={fullscreen} />)}
      {!filteredCameras.length && <div className="camera-no-results"><Search size={20} /><strong>No cameras match these filters</strong><span>Try a different establishment, status, or search term.</span></div>}
    </section>
    <div className="wall-footer"><span>Showing {Math.min(filteredCameras.length, density)} of {filteredCameras.length} matching cameras</span><button onClick={() => { setSearch(''); setEstablishment('All establishments'); setStateFilter('All cameras') }}>Clear filters <X size={13} /></button></div>
    {selected && <CameraDetailsDrawer camera={selected} onClose={() => setSelected(null)} />}
  </main>
}
