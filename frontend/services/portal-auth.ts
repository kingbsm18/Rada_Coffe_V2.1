import { apiServices } from './api-adapter'
import { isDemoProvider } from './config'

export type PortalKind = 'control' | 'business'
export type PortalSession = {
  portal: PortalKind
  user: { id: string; name: string; email: string; role: string; tenantId?: string; permissions: string[] }
  expiresAt?: number
}

export async function signInToPortal(portal: PortalKind, email: string, password: string): Promise<PortalSession> {
  if (isDemoProvider() && process.env.NODE_ENV !== 'production') {
    const response = await fetch(`/api/dev-auth/${portal}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    const session = await response.json()
    if (!response.ok) throw new Error(session.message ?? 'Sign-in failed.')
    return session as PortalSession
  }
  const session = await apiServices.auth.signIn(portal, { email, password })
  return { portal: session.portal, user: { id: session.user.id, name: session.user.displayName, email: session.user.email, role: session.user.role, permissions: session.user.permissions, tenantId: 'customerId' in session.user ? session.user.customerId : undefined } }
}

export async function signOutOfPortal(portal: PortalKind) {
  if (isDemoProvider() && process.env.NODE_ENV !== 'production') {
    const response = await fetch(`/api/dev-auth/${portal}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Could not end the development session.')
    return
  }
  return apiServices.auth.signOut(portal)
}
