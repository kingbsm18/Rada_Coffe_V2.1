import { NextRequest, NextResponse } from 'next/server'
import { appConfig } from './services/config'

const legacyControlRoutes: Record<string, string> = {
  '/superadmin': '/control/dashboard',
  '/superadmin/dashboard': '/control/dashboard',
  '/superadmin/cameras': '/control/cameras',
  '/superadmin/analytics': '/control/events',
}

type VerifiedSession = {
  portal?: 'control' | 'business'
  user?: { role?: string; permissions?: string[] }
  permissions?: string[]
}

async function verifySession(request: NextRequest, portal: 'control' | 'business') {
  const cookieName = portal === 'control' ? 'rada_control_session' : 'rada_business_session'
  if (!request.cookies.has(cookieName)) return null
  const apiBase = appConfig.apiBaseUrl
  if (!apiBase) return null
  try {
    const response = await fetch(`${apiBase}/${appConfig.apiVersion}/auth/${portal}/session`, {
      headers: { cookie: request.headers.get('cookie') ?? '', accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) return null
    const session = await response.json() as VerifiedSession
    if (session.portal !== portal || !session.user?.role) return null
    return session
  } catch {
    return null
  }
}

function internalRole(role: string) {
  return role === 'SUPER_ADMIN' || role.startsWith('RADA_')
}

function businessRoleCanOpen(role: string, section: string) {
  if (role === 'OWNER' || role === 'COMPANY_EXECUTIVE') return true
  if (role === 'MANAGER' || role === 'OPERATIONS_MANAGER') return !['team', 'settings'].includes(section)
  if (role === 'ESTABLISHMENT_MANAGER') return ['dashboard', 'cameras', 'analytics', 'reconciliation', 'alerts', 'reports'].includes(section)
  return ['dashboard', 'cameras', 'alerts'].includes(section)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const legacyTarget = legacyControlRoutes[pathname] ?? (pathname.startsWith('/superadmin/') ? pathname.replace('/superadmin/', '/control/') : null)
  if (legacyTarget) return NextResponse.redirect(new URL(legacyTarget, request.url))

  if (process.env.NODE_ENV !== 'production') return NextResponse.next()

  const controlLogin = pathname === '/control/login'
  const businessLogin = pathname === '/business/login'
  const isControlPath = pathname.startsWith('/control')
  const isBusinessPath = pathname.startsWith('/business')
  if (!isControlPath && !isBusinessPath) return NextResponse.next()

  const portal = isControlPath ? 'control' : 'business'
  const loginPath = portal === 'control' ? '/control/login' : '/business/login'
  const session = await verifySession(request, portal)
  if (!session) {
    if (controlLogin || businessLogin) return NextResponse.next()
    return NextResponse.redirect(new URL(loginPath, request.url))
  }

  if (portal === 'control' && !internalRole(session.user?.role ?? '')) {
    return NextResponse.redirect(new URL('/control/login', request.url))
  }
  if (portal === 'business' && (controlLogin || !businessRoleCanOpen(session.user?.role ?? 'STAFF', pathname.split('/')[2] ?? 'dashboard'))) {
    return NextResponse.redirect(new URL('/business/dashboard', request.url))
  }

  const permissions = session.user?.permissions ?? session.permissions
  const section = pathname.split('/')[2] ?? 'dashboard'
  if (permissions?.length && portal === 'business' && !permissions.includes('business:*') && !permissions.includes(`business:${section}:read`)) {
    return NextResponse.redirect(new URL('/business/dashboard', request.url))
  }
  if (permissions?.length && portal === 'control' && !controlLogin && !permissions.includes('control:*') && !permissions.includes(`control:${section}:read`)) {
    return NextResponse.redirect(new URL('/control/dashboard', request.url))
  }

  if (controlLogin) return NextResponse.redirect(new URL('/control/dashboard', request.url))
  if (businessLogin) return NextResponse.redirect(new URL('/business/dashboard', request.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/control/:path*', '/business/:path*', '/superadmin/:path*', '/superadmin'],
}
