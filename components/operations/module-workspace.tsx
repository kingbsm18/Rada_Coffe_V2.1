'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import { OperationsShell } from '@/components/layout/operations-shell'
import type { OperationsModule, OperationsRecord } from '@/lib/operations/modules'

const calmStatuses = new Set(['Demo', 'Connected', 'Healthy', 'Ready', 'Current', 'Guide'])

export function ModuleWorkspace({ module }: { module: OperationsModule }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [selected, setSelected] = useState<OperationsRecord | null>(null)
  const statuses = useMemo(() => ['All statuses', ...new Set(module.records.map((record) => record.status))], [module.records])
  const records = useMemo(() => module.records.filter((record) => (status === 'All statuses' || record.status === status) && `${record.id} ${record.name} ${record.location} ${record.status} ${record.detail}`.toLowerCase().includes(query.trim().toLowerCase())), [module.records, query, status])
  const reviewCount = module.records.filter((record) => !calmStatuses.has(record.status)).length

  return <OperationsShell><main className="ops-content module-content">
    <div className="ops-heading module-heading"><div><div className="section-kicker"><span className="kicker-rule" />{module.eyebrow}<span className="demo-label">DEMO WORKSPACE</span></div><h1>{module.title}</h1><p>{module.description}</p></div><Link className="module-back-link" href="/superadmin/dashboard">Command center <ArrowUpRight size={14} /></Link></div>
    <div className="module-summary-grid">
      <article className="module-summary-card"><span>Records in view</span><strong>{records.length}</strong><small>Filtered from {module.records.length} fixtures</small></article>
      <article className="module-summary-card"><span>Needs review</span><strong>{reviewCount}</strong><small>Demo data only · not live status</small></article>
      <article className="module-summary-card"><span>Data source</span><strong className="module-source-value">Not connected</strong><small>Connect a backend for live records</small></article>
    </div>
    <section className="surface module-table-panel">
      <div className="module-table-heading"><div><h2>{module.title}</h2><p>Search and filter the available demo records.</p></div><span className="demo-label">ILLUSTRATIVE ONLY</span></div>
      <div className="module-controls"><label className="module-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" aria-label={`Search ${module.title.toLowerCase()}`} /></label><label className="module-status-filter"><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label></div>
      {records.length ? <div className="module-table-wrap"><table className="module-table"><thead><tr><th scope="col">Name</th><th scope="col">Location</th><th scope="col">Status</th><th scope="col">Details</th><th scope="col"><span className="sr-only">Select record</span></th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><button className="module-record-button" onClick={() => setSelected(selected?.id === record.id ? null : record)} aria-pressed={selected?.id === record.id}><strong>{record.name}</strong><small>{record.id}</small></button></td><td>{record.location}</td><td><span className={`module-status ${calmStatuses.has(record.status) ? 'is-calm' : 'is-review'}`}>{record.status}</span></td><td className="module-detail-cell">{record.detail}</td><td><button className="module-row-action" onClick={() => setSelected(selected?.id === record.id ? null : record)} aria-label={`View details for ${record.name}`}><ArrowUpRight size={15} /></button></td></tr>)}</tbody></table></div> : <div className="module-empty-state"><strong>No matching records</strong><span>Try changing the search or status filter.</span></div>}
      {selected && <div className="module-selected-detail" role="status"><div><span>SELECTED RECORD · {selected.id}</span><strong>{selected.name}</strong><p>{selected.detail}</p></div><button onClick={() => setSelected(null)} aria-label="Close selected record details">Close</button></div>}
    </section>
    <p className="module-disclaimer">This workspace uses illustrative fixtures. It does not represent live customer, device, revenue, or system status.</p>
  </main></OperationsShell>
}
