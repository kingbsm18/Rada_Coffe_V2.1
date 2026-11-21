'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { Activity, AlertCircle, BarChart3, Building2, Camera, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, Coffee, Cpu, FileClock, Gauge, LayoutDashboard, LifeBuoy, Network, Settings2, Shield, Users, Boxes, Store, Bell, ArrowUpRight, LogOut, LockKeyhole, Menu, X } from 'lucide-react'
import { usePortalData, roleCanAccess } from '@/services/portal-data'
import { isDemoProvider } from '@/services/config'
import { signOutOfPortal } from '@/services/portal-auth'
import { fetchBusinessWorkspace } from '@/services/business-api'
import { usePortalSession } from '@/services/portal-session'

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

function DevelopmentBadge() {
  return isDemoProvider() ? <span className="development-badge"><i /><span><strong>DEVELOPMENT ENVIRONMENT</strong><small>LOCAL DATA · API NOT CONNECTED</small></span></span> : null
}

function useMobileNavigation(pathname: string) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  useEffect(() => { setMobileOpen(false) }, [pathname])
  useEffect(() => {
    if (!mobileOpen) return
    const focusable = () => Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])
    focusable().find((element) => element.closest('nav'))?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        menuButtonRef.current?.focus()
        return
      }
      if (event.key !== 'Tab') return
      const elements = focusable()
      const first = elements[0]
      const last = elements.at(-1)
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])
  function closeMobileNavigation(restoreFocus = false) {
    setMobileOpen(false)
    if (restoreFocus) menuButtonRef.current?.focus()
  }
  return { mobileOpen, setMobileOpen, menuButtonRef, sidebarRef, closeMobileNavigation }
}

export function ControlShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { mobileOpen, setMobileOpen, menuButtonRef, sidebarRef, closeMobileNavigation } = useMobileNavigation(pathname)
  const section = pathname.split('/').filter(Boolean).at(-1) ?? 'dashboard'
  const title = pathname.startsWith('/control/customers/') && section !== 'new' ? 'Customer details' : titles[section] ?? 'RADA Control'
  const { session, isLoading } = usePortalSession('control')
  const { events: controlEvents } = usePortalData()
  const controlOpenAlertCount = controlEvents.filter((event) => event.status !== 'Resolved').length
  useEffect(() => { if (isDemoProvider() && !isLoading && !session) router.replace('/control/login') }, [isLoading, router, session])
  async function logout() {
    try { await signOutOfPortal('control') } catch { /* Session cookies are invalidated by the auth service when available. */ }
    router.push('/control/login')
  }

  if (isDemoProvider() && (isLoading || !session || (session.user.role !== 'SUPER_ADMIN' && !session.user.role.startsWith('RADA_')))) return <div className="portal-auth-check" role="status">Verifying RADA Control access…</div>
  const accountName = session?.user.name ?? 'RADA team member'
  const accountRole = session?.user.role ?? 'Internal account'

  return <div className="portal-frame control-frame">
    <a className="portal-skip" href="#portal-main">Skip to main content</a>
    <aside ref={sidebarRef} className={`portal-sidebar control-sidebar ${mobileOpen ? 'mobile-open' : ''}`} id="control-navigation">
      <button className="portal-sidebar-close" type="button" aria-label="Close navigation" onClick={() => closeMobileNavigation(true)}><X /></button>
      <PortalBrand />
      <div className="control-scope"><span className="scope-glyph"><Shield size={16} /></span><span><strong>Platform scope</strong><small>All customer tenants</small></span><ChevronDown size={14} /></div>
      <nav className="portal-nav" aria-label="RADA Control navigation">
        {controlNavigation.map((group) => <section className="portal-nav-group" key={group.group}><h2>{group.group}</h2>{group.items.map(({ label, href, icon: Icon }) => <Link className={`portal-nav-link ${activePath(pathname, href) ? 'is-active' : ''}`} href={href} key={href} aria-label={label} title={label} aria-current={activePath(pathname, href) ? 'page' : undefined} onClick={() => setMobileOpen(false)}><Icon aria-hidden="true" /><span>{label}</span>{label === 'Alerts & incidents' && controlOpenAlertCount > 0 && <b className="nav-count-control">{controlOpenAlertCount}</b>}</Link>)}</section>)}
      </nav>
      <div className="portal-sidebar-foot"><div className="staff-avatar">{accountName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><span><strong>{accountName}</strong><small>{accountRole}</small></span></div>
    </aside>
    <div className="portal-main-column">
      {mobileOpen && <button className="portal-sidebar-overlay" type="button" aria-label="Close navigation" onClick={() => closeMobileNavigation(true)} />}
      <header className="portal-topbar control-topbar"><button ref={menuButtonRef} className="portal-mobile-menu" type="button" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} aria-controls="control-navigation" onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X /> : <Menu />}</button><div className="portal-breadcrumb"><span>RADA CONTROL</span><ChevronRight /><strong>{title}</strong></div><div className="portal-top-actions"><DevelopmentBadge /><details className="portal-account-menu"><summary aria-label="Open RADA Control account menu"><span>{accountName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><strong>{accountName}</strong><ChevronDown /></summary><div className="portal-account-popover"><strong>{accountName}</strong><small>{accountRole}</small><button onClick={logout}><LogOut /> Sign out</button></div></details></div></header>
      <main className="portal-main" id="portal-main">{children}</main>
    </div>
  </div>
}

export function BusinessShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { mobileOpen, setMobileOpen, menuButtonRef, sidebarRef, closeMobileNavigation } = useMobileNavigation(pathname)
  const section = pathname.split('/').filter(Boolean).at(-1) ?? 'dashboard'
  const title = titles[section] ?? 'Business overview'
  const development = isDemoProvider()
  const { session, isLoading } = usePortalSession('business')
  useEffect(() => { if (development && !isLoading && !session) router.replace('/business/login') }, [development, isLoading, router, session])
  const { tenants, users, events, activeSiteId, setActiveSiteId } = usePortalData()
  const { data: workspace } = useSWR(development ? null : '/v1/business/workspace', () => fetchBusinessWorkspace())
  const sessionTenantId = session?.user.tenantId
  const previousTenantId = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (development && previousTenantId.current && sessionTenantId && previousTenantId.current !== sessionTenantId) setActiveSiteId('all')
    if (sessionTenantId) previousTenantId.current = sessionTenantId
  }, [development, sessionTenantId, setActiveSiteId])
  const tenant = development ? tenants.find((item) => item.id === sessionTenantId) : workspace?.tenant
  const user = development
    ? users.find((item) => item.id === session?.user.id && item.tenantId === sessionTenantId) ?? users.find((item) => item.tenantId === sessionTenantId && item.role === 'OWNER')
    : workspace?.user
  const userSites = useMemo(() => development
    ? tenant?.sites.filter((site) => user?.role === 'OWNER' || user?.siteIds.includes(site.id)) ?? []
    : workspace?.authorizedSites ?? [], [development, tenant, user, workspace])
  const notificationCount = development ? events.filter((event) => event.tenantId === sessionTenantId && event.status !== 'Resolved').length : workspace?.events.filter((event) => event.status !== 'Resolved').length ?? 0
  const visibleNavigation = businessNavigation.filter((item) => roleCanAccess(user?.role ?? 'STAFF', item.href.split('/').at(-1) ?? 'dashboard', user?.permissions) && (item.label !== 'Establishments' || user?.role === 'OWNER' || Boolean(user?.permissions?.includes('business:establishments:read'))))
  async function logout() {
    try { await signOutOfPortal('business') } catch { /* Session cookies are invalidated by the auth service when available. */ }
    router.push('/business/login')
  }

  if (development && (isLoading || !session || session.portal !== 'business' || session.user.role === 'SUPER_ADMIN')) return <div className="portal-auth-check" role="status">Verifying customer workspace access…</div>
  const accountName = development ? session?.user.name ?? 'Business user' : workspace?.user ? `${workspace.user.firstName} ${workspace.user.lastName}` : 'Business user'
  const accountRole = development ? session?.user.role ?? 'Customer' : workspace?.user.role ?? 'Customer'
  if (development && !isLoading && session?.portal === 'business' && !tenant) return <main className="portal-auth-check inactive-workspace" role="alert"><div><strong>This customer workspace is no longer available</strong><p>The customer record has been removed from local development data. Sign out to continue.</p><button className="business-outline-action" onClick={() => void logout()}>Sign out</button></div></main>
  if (development && tenant?.status === 'Inactive') return <main className="portal-auth-check inactive-workspace" role="alert"><div><strong>This customer workspace is inactive</strong><p>RADA has deactivated access to {tenant.name}. Contact your administrator if you need access restored.</p><button className="business-outline-action" onClick={() => void logout()}>Sign out</button></div></main>

  return <div className="portal-frame business-frame">
    <a className="portal-skip" href="#portal-main">Skip to main content</a>
    <aside ref={sidebarRef} className={`portal-sidebar business-sidebar ${mobileOpen ? 'mobile-open' : ''}`} id="business-navigation">
      <button className="portal-sidebar-close" type="button" aria-label="Close navigation" onClick={() => closeMobileNavigation(true)}><X /></button>
      <PortalBrand business />
      <div className="business-workspace-label">YOUR WORKSPACE</div>
      <nav className="portal-nav business-nav" aria-label="RADA Coffee Business navigation">{visibleNavigation.map(({ label, href, icon: Icon }) => <Link className={`portal-nav-link ${activePath(pathname, href) ? 'is-active' : ''}`} href={href} key={href} aria-label={label} title={label} aria-current={activePath(pathname, href) ? 'page' : undefined} onClick={() => setMobileOpen(false)}><Icon aria-hidden="true" /><span>{label}</span>{label === 'Alerts' && notificationCount > 0 && <b className="nav-count-business">{notificationCount}</b>}</Link>)}</nav>
      <div className="business-help"><div className="help-icon"><CircleHelp /></div><div><strong>Need a hand?</strong><small>Our team is here to help.</small></div><Link href="mailto:support@radacoffee.example" aria-label="Contact RADA support"><ArrowUpRight /></Link></div>
      <div className="portal-sidebar-foot"><div className="staff-avatar business-avatar">{accountName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><span><strong>{accountName}</strong><small>{accountRole} account</small></span></div>
    </aside>
    <div className="portal-main-column">
      {mobileOpen && <button className="portal-sidebar-overlay" type="button" aria-label="Close navigation" onClick={() => closeMobileNavigation(true)} />}<header className="portal-topbar business-topbar"><button ref={menuButtonRef} className="portal-mobile-menu" type="button" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} aria-controls="business-navigation" onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X /> : <Menu />}</button><div className="business-context-controls"><span className="business-tenant-label"><Building2 />{tenant?.name ?? 'Business workspace'}</span><label className="context-select site-select"><Store /><span className="sr-only">Filter by establishment</span><select aria-label="Filter by establishment" value={activeSiteId} onChange={(event) => setActiveSiteId(event.target.value)}><option value="all">All establishments</option>{userSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select><ChevronDown /></label></div><div className="portal-top-actions"><DevelopmentBadge /><button className="top-icon-button" aria-label={`Notifications${notificationCount ? `, ${notificationCount} open item${notificationCount === 1 ? '' : 's'}` : ''}`} onClick={() => router.push('/business/alerts')}><Bell />{notificationCount > 0 && <span />}</button><details className="portal-account-menu"><summary aria-label="Open business account menu"><span>{accountName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><strong>{accountName}</strong><ChevronDown /></summary><div className="portal-account-popover"><strong>{accountName}</strong><small>{accountRole} account</small><button onClick={logout}><LogOut /> Sign out</button></div></details></div></header>
      <main className="portal-main" id="portal-main">{children}</main>
    </div>
  </div>
}
