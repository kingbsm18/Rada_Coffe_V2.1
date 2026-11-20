'use client'

import { DevelopmentDataProvider } from '@/services/development-data'

export function PortalDevelopmentProvider({ children }: { children: React.ReactNode }) {
  return <DevelopmentDataProvider>{children}</DevelopmentDataProvider>
}
