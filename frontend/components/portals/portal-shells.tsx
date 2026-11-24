'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import useSWR from 'swr'
import { Activity, AlertCircle, BarChart3, Building2, Camera, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, Coffee, Cpu, FileClock, Gauge, LayoutDashboard, LifeBuoy, Network, Settings2, Shield, Users, Boxes, Store, Bell, ArrowUpRight, LogOut, LockKeyhole } from 'lucide-react'
import { usePortalData, roleCanAccess } from '@/services/portal-data'
import { isApiConfigured, isDemoProvider } from '@/services/config'
import { useBackendReadiness } from '@/services/portal-hooks'
import { signOutOfPortal } from '@/services/portal-auth'
import { fetchBusinessWorkspace } from '@/services/business-api'

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard }

const controlNavigation: Array<{ group: string; items: NavItem[] }> = [
  { group: 'INTELLIGENCE', items: [
    { label: 'Command center', href: '/control/dashboard', icon: LayoutDashboard },
    { label: 'Camera wall', href: '/control/cameras', icon: Camera },
    { label: 'Reconciliation', href: '/control/events', icon: ClipboardList },
    { label: 'Alerts & incidents', href: '/control/alerts', icon: AlertCircle },
  ] },
  { group: 'CUSTOMER OPERATIONS', items: [
    { label: 'Customers', href: '/control/customers', icon: Building2 },
    { label: 'Establishments', href: '/control/establishments', icon: Store },
    { label: 'Users & access', href: '/control/users', icon: Users },
    { label: 'Menus & products', href: '/control/products', icon: Boxes },
    { label: 'POS & CV integrations', href: '/control/integrations', icon: Network },
    { label: 'Subscriptions', href: '/control/plans', icon: Shield },
  ] },
  { group: 'PLATFORM ENGINEERING', items: [
    { label: 'Platform health', href: '/control/monitoring', icon: Gauge },
    { label: 'Edge devices', href: '/control/devices', icon: Cpu },
    { label: 'Model registry', href: '/control/models', icon: Activity },
    { label: 'Audit trail', href: '/control/audit', icon: FileClock },
    { label: 'Settings', href: '/control/settings', icon: Settings2 },
    { label: 'Support', href: '/control/support', icon: LifeBuoy },
  ] },
]

const businessNavigation: NavItem[] = [
  { label: 'Overview', href: '/business/dashboard', icon: LayoutDashboard },
  { label: 'Live cameras', href: '/business/cameras', icon: Camera },
  { label: 'Analytics', href: '/business/analytics', icon: BarChart3 },
  { label: 'Reconciliation', href: '/business/reconciliation', icon: ClipboardList },
  { label: 'Alerts', href: '/business/alerts', icon: Bell },
  { label: 'Reports', href: '/business/reports', icon: FileClock },
  { label: 'Establishments', href: '/business/establishments', icon: Store },
  { label: 'Team & access', href: '/business/team', icon: Users },
  { label: 'Account settings', href: '/business/settings', icon: Settings2 },
]

const titles: Record<string, string> = {
  dashboard: 'Command center', cameras: 'Camera operations', events: 'Reconciliation events', alerts: 'Alerts & incidents', customers: 'Customers', establishments: 'Establishments', users: 'Users & access', products: 'Menus & products', integrations: 'Integrations', plans: 'Subscriptions', monitoring: 'Platform health', devices: 'Edge devices', models: 'CV model registry', audit: 'Audit trail', settings: 'Settings', support: 'Support', analytics: 'Analytics', reconciliation: 'Reconciliation', reports: 'Reports', team: 'Team & access',
}

function activePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`) || (href.endsWith('/dashboard') && pathname === href.replace('/dashboard', ''))
}

function PortalBrand({ business = false }: { business?: boolean }) {
  return <Link className={`portal-brand ${business ? 'portal-brand-business' : ''}`} href={business ? '/business/dashboard' : '/control/dashboard'} aria-label={business ? 'RADA Coffee Business home' : 'RADA Control home'}>
    <span className="portal-brand-mark"><Coffee aria-hidden="true" /></span>
    <span className="portal-brand-copy"><strong>RADA<span>.</span></strong><small>{business ? 'COFFEE BUSINESS' : 'CONTROL'}</small></span>
  </Link>
}

function BackendStatus() {
  const { data, error, isLoading } = useBackendReadiness()
  const [state, label] = isDemoProvider() ? ['demo', 'Demo data · API not used']
    : !isApiConfigured() ? ['error', 'API not configured']
    : isLoading ? ['pending', 'Checking API']
    : data?.status === 'ready' ? ['ready', 'API connected']
    : ['error', error ? 'API unreachable' : 'API not ready']
  return <span className="control-system-state" data-state={state} role="status"><i /> {label}</span>
}

function DevelopmentBadge() {
  return isDemoProvider() ? <span className="development-badge"><i /> DEVELOPMENT</span> : null
}

export function ControlShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const section = pathname.split('/').filter(Boolean).at(-1) ?? 'dashboard'
  const title = titles[section] ?? 'RADA Control'
  async function logout() {
    try { await signOutOfPortal('control') } catch { /* Session cookies are invalidated by the auth service when available. */ }
    router.push('/control/login')
  }

  return <div className="portal-frame control-frame">
    <a className="portal-skip" href="#portal-main">Skip to main content</a>
    <aside className="portal-sidebar control-sidebar">
      <PortalBrand />
      <div className="control-scope"><span className="scope-glyph"><Shield size={16} /></span><span><strong>Platform scope</strong><small>All customer tenants</small></span><ChevronDown size={14} /></div>
      <nav className="portal-nav" aria-label="RADA Control navigation">
        {controlNavigation.map((group) => <section className="portal-nav-group" key={group.group}><h2>{group.group}</h2>{group.items.map(({ label, href, icon: Icon }) => <Link className={`portal-nav-link ${activePath(pathname, href) ? 'is-active' : ''}`} href={href} key={href} aria-label={label} aria-current={activePath(pathname, href) ? 'page' : undefined}><Icon aria-hidden="true" /><span>{label}</span>{isDemoProvider() && label === 'Alerts & incidents' && <b className="nav-count-control">3</b>}</Link>)}</section>)}
      </nav>
      <div className="portal-sidebar-foot"><div className="staff-avatar">{process.env.NODE_ENV === 'production' ? 'RA' : 'AM'}</div><span><strong>{process.env.NODE_ENV === 'production' ? 'RADA team member' : 'Alex Morgan'}</strong><small>{process.env.NODE_ENV === 'production' ? 'Internal account' : 'Development administrator'}</small></span><button className="sidebar-logout" onClick={logout} aria-label="Sign out of RADA Control"><LogOut /></button></div>
    </aside>
    <div className="portal-main-column">
      <header className="portal-topbar control-topbar"><div className="portal-breadcrumb"><span>RADA CONTROL</span><ChevronRight /><strong>{title}</strong></div><div className="portal-top-actions"><DevelopmentBadge /><BackendStatus />{isDemoProvider() && <Link className="portal-switch" href="/business/dashboard"><Store /> Business preview <ArrowUpRight /></Link>}</div></header>
      <main className="portal-main" id="portal-main">{children}</main>
    </div>
  </div>
}

export function BusinessShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const section = pathname.split('/').filter(Boolean).at(-1) ?? 'dashboard'
  const title = titles[section] ?? 'Business overview'
  const development = isDemoProvider()
  const { tenants, users, activeTenantId, activeSiteId, selectedUserId, setActiveTenantId, setActiveSiteId, setSelectedUserId } = usePortalData()
  const { data: workspace } = useSWR(development ? null : '/v1/business/workspace', () => fetchBusinessWorkspace())
  const tenant = development ? tenants.find((item) => item.id === activeTenantId) : workspace?.tenant
  const user = development
    ? users.find((item) => item.id === selectedUserId && item.tenantId === activeTenantId) ?? users.find((item) => item.tenantId === activeTenantId)
    : workspace?.user
  const userSites = useMemo(() => development
    ? tenant?.sites.filter((site) => user?.role === 'OWNER' || user?.siteIds.includes(site.id)) ?? []
    : workspace?.authorizedSites ?? [], [development, tenant, user, workspace])
  const visibleNavigation = businessNavigation.filter((item) => roleCanAccess(user?.role ?? 'STAFF', item.href.split('/').at(-1) ?? 'dashboard', user?.permissions) && (item.label !== 'Establishments' || user?.role === 'OWNER' || Boolean(user?.permissions?.includes('business:establishments:read'))))
  async function logout() {
    try { await signOutOfPortal('business') } catch { /* Session cookies are invalidated by the auth service when available. */ }
    router.push('/business/login')
  }

  return <div className="portal-frame business-frame">
    <a className="portal-skip" href="#portal-main">Skip to main content</a>
    <aside className="portal-sidebar business-sidebar">
      <PortalBrand business />
      <div className="business-workspace-label">YOUR WORKSPACE</div>
      <nav className="portal-nav business-nav" aria-label="RADA Coffee Business navigation">{visibleNavigation.map(({ label, href, icon: Icon }) => <Link className={`portal-nav-link ${activePath(pathname, href) ? 'is-active' : ''}`} href={href} key={href} aria-label={label} aria-current={activePath(pathname, href) ? 'page' : undefined}><Icon aria-hidden="true" /><span>{label}</span>{isDemoProvider() && label === 'Alerts' && <b className="nav-count-business">2</b>}</Link>)}</nav>
      <div className="business-help"><div className="help-icon"><CircleHelp /></div><div><strong>Need a hand?</strong><small>Our team is here to help.</small></div><Link href="mailto:support@radacoffee.example" aria-label="Contact RADA support"><ArrowUpRight /></Link></div>
      <div className="portal-sidebar-foot"><div className="staff-avatar business-avatar">{user ? `${user.firstName[0]}${user.lastName[0]}` : 'BU'}</div><span><strong>{user ? `${user.firstName} ${user.lastName}` : 'Business user'}</strong><small>{user?.role ?? 'Customer'} account</small></span><button className="sidebar-logout" onClick={logout} aria-label="Sign out of RADA Coffee Business"><LogOut /></button></div>
    </aside>
    <div className="portal-main-column">
      <header className="portal-topbar business-topbar"><div className="business-context-controls"><label className="context-select tenant-select"><Building2 /><span className="sr-only">Select customer workspace</span><select aria-label="Select customer workspace" value={tenant?.id ?? ''} onChange={(event) => { setActiveTenantId(event.target.value); setActiveSiteId('all'); const nextUser = users.find((candidate) => candidate.tenantId === event.target.value && candidate.role === 'OWNER'); if (nextUser) setSelectedUserId(nextUser.id) }}>{(development ? tenants : tenant ? [tenant] : []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown /></label><label className="context-select site-select"><Store /><span className="sr-only">Filter by establishment</span><select aria-label="Filter by establishment" value={activeSiteId} onChange={(event) => setActiveSiteId(event.target.value)}><option value="all">All establishments</option>{userSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select><ChevronDown /></label></div><div className="portal-top-actions"><DevelopmentBadge />{isDemoProvider() && <Link className="portal-switch" href="/control/dashboard"><Shield /> Control preview <ArrowUpRight /></Link>}{isDemoProvider() && <label className="dev-persona"><span>Preview as</span><select aria-label="Preview business role" value={user?.id ?? ''} onChange={(event) => { setSelectedUserId(event.target.value); setActiveSiteId('all') }}>{users.filter((candidate) => candidate.tenantId === activeTenantId).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.role.charAt(0) + candidate.role.slice(1).toLowerCase()} · {candidate.firstName}</option>)}</select></label>}<button className="top-icon-button" aria-label="Notifications" onClick={() => router.push('/business/alerts')}><Bell /><span /></button><div className="business-user-chip"><span>{user ? `${user.firstName[0]}${user.lastName[0]}` : 'BU'}</span><strong>{user?.firstName ?? 'Business'}</strong></div></div></header>
      <main className="portal-main" id="portal-main">{children}</main>
    </div>
  </div>
}
