'use client'

import { createContext, useContext, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import type { Session } from '@/types/domain'
import { appConfig, isApiConfigured } from './config'
import { apiServices } from './api-adapter'

export type AuthContextValue = { session: Session | null; loading: boolean; error: Error | undefined; currentUser: Session['user'] | null; currentTenant: Session['tenant'] | null; signIn: (portal: 'control' | 'business', email: string, password: string) => Promise<Session>; signOut: (portal: 'control' | 'business') => Promise<void> }
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const portal = pathname.startsWith('/control') ? 'control' : 'business'
  const enabled = appConfig.dataProvider === 'api' && isApiConfigured() && (pathname.startsWith('/control') || pathname.startsWith('/business'))
  const { data, error, isLoading, mutate } = useSWR<Session | null>(enabled ? `rada-auth-session:${portal}` : null, () => apiServices.auth.session(portal))
  const value = useMemo<AuthContextValue>(() => ({
    session: data ?? null,
    loading: enabled && isLoading,
    error: error as Error | undefined,
    currentUser: data?.user ?? null,
    currentTenant: data?.tenant ?? null,
    signIn: async (portal, email, password) => { const session = await apiServices.auth.signIn(portal, { email, password }); await mutate(session, false); return session },
    signOut: async (portal) => { await apiServices.auth.signOut(portal); await mutate(null, false) },
  }), [data, enabled, error, isLoading, mutate])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}

export function hasPermission(session: Session | null, permission: string) {
  return Boolean(session?.user.permissions.includes('*') || session?.user.permissions.includes(permission))
}
