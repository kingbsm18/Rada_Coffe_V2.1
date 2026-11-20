import { notFound } from 'next/navigation'
import { ControlCustomersPage, ControlDashboard, ControlModulePage } from '@/components/portals/control-pages'
import { ControlShell } from '@/components/portals/portal-shells'

const controlSections = new Set(['dashboard', 'customers', 'establishments', 'users', 'products', 'plans', 'integrations', 'monitoring', 'devices', 'models', 'audit', 'settings', 'support', 'cameras', 'events', 'alerts'])

export default async function ControlSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!controlSections.has(section)) notFound()
  const content = section === 'dashboard' ? <ControlDashboard /> : section === 'customers' ? <ControlCustomersPage /> : <ControlModulePage section={section} />
  return <ControlShell>{content}</ControlShell>
}
