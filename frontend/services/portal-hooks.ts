'use client'

import useSWR from 'swr'
import { isDemoProvider } from './config'
import { fetchBusinessWorkspace } from './business-api'
import { fetchControlWorkspace } from './control-api'

export function useControlWorkspace() {
  return useSWR(isDemoProvider() ? null : '/v1/control/workspace', () => fetchControlWorkspace(), { shouldRetryOnError: false })
}

export function useBusinessWorkspace() {
  return useSWR(isDemoProvider() ? null : '/v1/business/workspace', () => fetchBusinessWorkspace(), { shouldRetryOnError: false })
}
