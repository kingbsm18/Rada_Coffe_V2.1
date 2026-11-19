'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CalendarDays, Download, Layers3, ShoppingBag } from 'lucide-react'
import { OperationsShell } from '@/components/layout/operations-shell'
import { CategoryAnalytics, DiscrepancyTrendChart, EstablishmentComparison, HandoverVsPOSChart, HourlyActivityChart, ReconciliationOverview } from '@/components/operations/operations-panels'
import { demoAnalytics } from '@/lib/demo-data/operations'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('Last 7 days')
  const [category, setCategory] = useState('All categories')
  const [establishment, setEstablishment] = useState('All establishments')
  const categories = useMemo(() => Array.from(new Set(demoAnalytics.categories.map((item) => item.category))), [])
  const scope = [establishment !== 'All establishments' ? establishment : null, category !== 'All categories' ? category.replaceAll('_', ' ') : null].filter(Boolean).join(' · ')
  return <OperationsShell><main className="ops-content analytics-page">
    <div className="ops-heading"><div><div className="section-kicker"><span className="kicker-rule" />BUSINESS INTELLIGENCE <span className="demo-label">DEMO MODE · FIXTURE DATA</span></div><h1>Revenue Intelligence</h1><p>Reconcile physical product handovers with declared POS quantities.</p></div><button className="outline-action" disabled><Download size={14} />Export report</button></div>
    <div className="analytics-filters"><label><CalendarDays size={14} /><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Analytics time period"><option>Today</option><option>Yesterday</option><option>Last 7 days</option><option>Last 30 days</option><option>Custom period</option></select></label><label><Layers3 size={14} /><select value={establishment} onChange={(event) => setEstablishment(event.target.value)} aria-label="Analytics establishment"><option>All establishments</option>{demoAnalytics.establishments.map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label><ShoppingBag size={14} /><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Analytics category"><option>All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><span className="analytics-filter-summary">{scope ? `Scope: ${scope}` : 'Scope: all authorized establishments'}</span></div>
    <section className="revenue-overview"><div className="section-heading-row"><div><div className="section-kicker"><span className="kicker-rule" />RECONCILIATION OVERVIEW</div><h2>Observed operations at a glance</h2><p>Physical CV observations compared with POS declarations · {period.toLowerCase()} fixture window</p></div><span className="demo-label">NOT PRODUCTION DATA</span></div><ReconciliationOverview /></section>
    <div className="analytics-primary-grid"><HandoverVsPOSChart /><DiscrepancyTrendChart /></div>
    <div className="analytics-secondary-grid"><CategoryAnalytics category={category} /><EstablishmentComparison establishment={establishment} /><HourlyActivityChart /></div>
    <div className="analytics-operator-note"><span><AlertTriangle size={16} /></span><div><strong>Interpretation note</strong><p>Reconciliation exceptions are operational signals for review. Estimated financial discrepancies are indicative only and must not be treated as confirmed accounting loss, theft, or fraud.</p></div></div>
    <footer className="ops-footer"><span>RADA COFFEE INTELLIGENCE</span><span><i />{period} · Demo fixtures · backend timestamps unavailable</span></footer>
  </main></OperationsShell>
}
