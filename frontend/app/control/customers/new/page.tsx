import type { Metadata } from 'next'
import { ControlShell } from '@/components/portals/portal-shells'
import { CustomerProvisioningWizard } from '@/components/portals/customer-provisioning-wizard'

export const metadata: Metadata = { title: 'Create customer | RADA Control' }

export default function NewCustomerPage() {
  return <ControlShell><CustomerProvisioningWizard /></ControlShell>
}
