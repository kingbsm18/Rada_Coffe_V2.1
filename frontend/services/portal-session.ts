'use client'

import useSWR from 'swr'
import type { DevelopmentPortal, DevelopmentSession } from './development-auth-adapter'
import { isDemoProvider } from './config'

async function readSession(portal: DevelopmentPortal): Promise<DevelopmentSession | null> {
  const response = await fetch(`/api/dev-auth/${portal}`, { cache: 'no-store' })
  if (response.status === 401 || response.status === 404) return null
  if (!response.ok) throw new Error('Could not verify this development session.')
  return response.json()
}

export function usePortalSession(portal: DevelopmentPortal) {
  const development = isDemoProvider() && process.env.NODE_ENV !== 'production'
  const { data, error, isLoading, mutate } = useSWR<DevelopmentSession | null>(development ? `dev-session:${portal}` : null, () => readSession(portal), { shouldRetryOnError: false, revalidateOnFocus: true })
  return { session: data ?? null, error, isLoading: development && isLoading, mutate }
}
