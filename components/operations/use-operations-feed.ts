'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { demoEvents, demoSnapshot } from '@/lib/demo-data/operations'
import { fetchOperationsSnapshot, isOperationsApiConfigured, subscribeToOperationsEvents } from '@/services/operations'
import type { OperationsEvent } from '@/types/operations'

export function useOperationsFeed() {
  const configured = isOperationsApiConfigured()
  const { data, error, isLoading, mutate } = useSWR(
    configured ? 'operations-snapshot' : null,
    () => fetchOperationsSnapshot(),
    { revalidateOnFocus: true, shouldRetryOnError: false },
  )
  const [connection, setConnection] = useState<'connected' | 'disconnected'>('disconnected')
  const [incomingEvents, setIncomingEvents] = useState<OperationsEvent[]>([])

  useEffect(() => subscribeToOperationsEvents((event) => {
    setIncomingEvents((previous) => [event, ...previous].slice(0, 100))
    void mutate()
  }, setConnection), [mutate])

  return {
    snapshot: configured ? data ?? null : demoSnapshot,
    events: configured ? incomingEvents : demoEvents,
    connection,
    configured,
    isLoading,
    error: error as Error | undefined,
    demoMode: !configured,
  }
}
