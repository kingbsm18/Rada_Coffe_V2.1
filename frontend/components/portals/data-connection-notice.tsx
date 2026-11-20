'use client'

import { appConfig, isApiConfigured, isDemoProvider } from '@/services/config'

export function DataConnectionNotice({ error }: { error?: unknown }) {
  if (isDemoProvider()) return null
  const message = error instanceof Error ? error.message : null
  const title = !isApiConfigured() ? 'API endpoint is not configured' : message ? 'Unable to connect to the RADA API' : 'Connecting to the RADA API'
  const detail = !isApiConfigured()
    ? 'API mode is active. Configure NEXT_PUBLIC_RADA_API_URL to load live records; demo data is intentionally disabled.'
    : message ?? `Requests use the ${appConfig.environment} environment. No fixture data is substituted in API mode.`
  return <div className={`connection-banner ${message || !isApiConfigured() ? 'connection-banner-error' : ''}`} role={message || !isApiConfigured() ? 'alert' : 'status'}>
    <span className="banner-symbol" aria-hidden="true">!</span>
    <span><strong>{title}</strong><small>{detail}</small></span>
  </div>
}
