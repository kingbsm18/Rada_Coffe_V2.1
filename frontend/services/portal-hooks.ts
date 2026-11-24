'use client'

import useSWR from 'swr'
import { isApiConfigured, isDemoProvider } from './config'
import { fetchBusinessWorkspace } from './business-api'
import { fetchControlWorkspace } from './control-api'
import { fetchBackendReadiness } from './health'

export function useControlWorkspace() {
  return useSWR(isDemoProvider() ? null : '/v1/control/workspace', () => fetchControlWorkspace(), { shouldRetryOnError: false })
}

export function useBusinessWorkspace() {
  return useSWR(isDemoProvider() ? null : '/v1/business/workspace', () => fetchBusinessWorkspace(), { shouldRetryOnError: false })
}

export function useBackendReadiness() {
  return useSWR(isDemoProvider() || !isApiConfigured() ? null : 'rada-backend-readiness', () => fetchBackendReadiness(), { refreshInterval: 30_000, shouldRetryOnError: false })
}
