import { notFound } from 'next/navigation'
import { BusinessDashboard, BusinessModulePage } from '@/components/portals/business-pages'
import { BusinessShell } from '@/components/portals/portal-shells'

const businessSections = new Set(['dashboard', 'cameras', 'analytics', 'reconciliation', 'alerts', 'reports', 'establishments', 'team', 'settings'])

export default async function BusinessSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!businessSections.has(section)) notFound()
  const content = section === 'dashboard' ? <BusinessDashboard /> : <BusinessModulePage section={section} />
  return <BusinessShell>{content}</BusinessShell>
}
