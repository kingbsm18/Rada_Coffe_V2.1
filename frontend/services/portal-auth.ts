import { apiServices } from './api-adapter'

export type PortalKind = 'control' | 'business'

export type PortalSession = {
  user: { id: string; name: string; email: string; role: string }
  portal: PortalKind
}

export async function signInToPortal(portal: PortalKind, email: string, password: string): Promise<PortalSession> {
  const session = await apiServices.auth.signIn(portal, { email, password })
  return { portal: session.portal, user: { id: session.user.id, name: session.user.displayName, email: session.user.email, role: session.user.role } }
}

export async function signOutOfPortal(portal: PortalKind) {
  return apiServices.auth.signOut(portal)
}
