import type { Metadata } from 'next'
import { PortalLogin } from '@/components/portals/portal-login'

export const metadata: Metadata = { title: 'RADA Control sign in' }

export default function ControlLoginPage() {
  return <PortalLogin portal="control" />
}
