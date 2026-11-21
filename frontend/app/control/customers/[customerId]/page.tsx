import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ControlShell } from '@/components/portals/portal-shells'
import { CustomerDetailPage } from '@/components/portals/customer-detail-page'

export const metadata: Metadata = { title: 'Customer details | RADA Control' }

export default async function CustomerDetailsRoute({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params
  if (!customerId) notFound()
  return <ControlShell><CustomerDetailPage customerId={customerId} /></ControlShell>
}
