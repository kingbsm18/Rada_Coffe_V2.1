import type { Metadata } from 'next'
import { PortalLogin } from '@/components/portals/portal-login'

export const metadata: Metadata = { title: 'RADA Coffee Business sign in' }

export default function BusinessLoginPage() {
  return <PortalLogin portal="business" />
}
