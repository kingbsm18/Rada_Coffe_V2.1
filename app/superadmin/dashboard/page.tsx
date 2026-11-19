import type { Metadata } from 'next'
import OperationsDashboard from '@/components/operations/dashboard'

export const metadata: Metadata = {
  title: 'Operations Command Center | RADA Coffee',
  description: 'Real-time visibility across RADA Coffee camera, edge, POS, and reconciliation operations.',
}

export default function DashboardPage() {
  return <OperationsDashboard />
}
