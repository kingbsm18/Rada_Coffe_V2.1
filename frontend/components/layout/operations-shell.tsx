'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Activity, AlertTriangle, Boxes, Building2, Camera, ChevronDown, ChevronLeft,
  ChevronRight, Coffee, Cpu, FileClock, Gauge, LayoutDashboard, LifeBuoy, Menu,
  MoreHorizontal, Network, Settings2, ShieldCheck, Sparkles, Users,
} from 'lucide-react'
import { getOperationsModule } from '@/lib/operations/modules'
import { OperationsSearch } from '@/components/layout/operations-search'

const sections = [
  { group: 'OPERATIONS', links: [
    { label: 'Command center', href: '/superadmin/dashboard', icon: LayoutDashboard },
    { label: 'Live operations', href: '/superadmin/live', icon: Activity },
    { label: 'Camera operations', href: '/superadmin/cameras', icon: Camera },
    { label: 'Analytics', href: '/superadmin/analytics', icon: Activity },
    { label: 'Reconciliation events', href: '/superadmin/events', icon: FileClock },
    { label: 'Alerts & anomalies', href: '/superadmin/alerts', icon: AlertTriangle },
    { label: 'Platform monitoring', href: '/superadmin/monitoring', icon: Gauge },
  ] },
  { group: 'VIDEO INFRASTRUCTURE', links: [
    { label: 'Camera inventory', href: '/superadmin/inventory', icon: Camera },
    { label: 'Edge devices', href: '/superadmin/edge', icon: Cpu },
    { label: 'CV model registry', href: '/superadmin/models', icon: Sparkles },
    { label: 'Deployments', href: '/superadmin/deployments', icon: Network },
  ] },
  { group: 'BUSINESS OPERATIONS', links: [
    { label: 'Customers', href: '/superadmin/customers', icon: Building2 },
    { label: 'Establishments', href: '/superadmin/establishments', icon: Coffee },
    { label: 'Users & permissions', href: '/superadmin/users', icon: Users },
    { label: 'Menus & products', href: '/superadmin/products', icon: Boxes },
    { label: 'POS integrations', href: '/superadmin/pos', icon: Network },
    { label: 'Subscriptions & plans', href: '/superadmin/plans', icon: ShieldCheck },
  ] },
  { group: 'PLATFORM', links: [
    { label: 'Audit trail', href: '/superadmin/audit', icon: FileClock },
    { label: 'Global settings', href: '/superadmin/settings', icon: Settings2 },
    { label: 'Help & support', href: '/superadmin/help', icon: LifeBuoy },
  ] },
]

const pageTitles: Record<string, string> = {
  '/superadmin/dashboard': 'Operations Command Center',
  '/superadmin/cameras': 'Camera Operations',
  '/superadmin/analytics': 'Revenue Intelligence',
}

export function OperationsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const module = getOperationsModule(pathname.split('/').filter(Boolean).at(-1) ?? '')
  const pageTitle = pageTitles[pathname] ?? module?.title ?? 'Operations'

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-visible' : ''}`}>
        <div className="sidebar-top">
          <Link className="brand-lockup" href="/superadmin/dashboard" aria-label="RADA Coffee command center">
            <span className="brand-mark"><img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rada_l%20%281%29-qHvP7Now8jrOtkv0HuBctgDGewTnTl.jpg" alt="" aria-hidden="true" /></span>
            <span><span className="brand-name">RADA<span className="brand-dot">.</span></span><span className="brand-product">COFFEE INTELLIGENCE</span></span>
          </Link>
          <button className="icon-button collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><ChevronLeft size={16} /></button>
        </div>
        <div className="workspace-switch"><span className="workspace-icon">R</span><span className="workspace-copy"><strong>RADA AI</strong><span>Super Admin workspace</span></span><ChevronDown size={14} /></div>
        <nav className="side-nav" aria-label="Main navigation">
          {sections.map((section) => <div className="nav-section" key={section.group}><div className="nav-group-label">{section.group}</div>{section.links.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href === '/superadmin/dashboard' && pathname === '/superadmin') || pathname.startsWith(`${href}/`)
            return <Link className={`nav-item ${active ? 'nav-item-active' : ''}`} href={href} key={href} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)}><Icon size={16} strokeWidth={1.8} /><span>{label}</span>{label === 'Alerts & anomalies' && <span className="nav-count">3</span>}</Link>
          })}</div>)}
        </nav>
        <div className="sidebar-bottom"><div className="profile-card"><div className="avatar">AM</div><div className="profile-copy"><strong>Alex Morgan</strong><span>Super Admin</span></div><MoreHorizontal size={16} className="profile-more" /></div></div>
      </aside>
      {mobileOpen && <button className="mobile-backdrop show" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
      <div className="main-column">
        <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={18} /></button><div className="breadcrumbs"><span>RADA AI</span><ChevronRight size={13} /><strong>{pageTitle}</strong></div><div className="topbar-actions"><OperationsSearch /><span className="health-pill disconnected-pill"><i />Live services disconnected</span><div className="top-avatar">AM</div></div></header>
        <div id="main-content" tabIndex={-1}>{children}</div>
      </div>
    </div>
  )
}
