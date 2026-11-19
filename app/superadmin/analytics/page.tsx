import type { Metadata } from 'next'
import AnalyticsPage from '@/components/operations/analytics-page'

export const metadata: Metadata = {
  title: 'Revenue Intelligence | RADA Coffee',
  description: 'POS and computer vision reconciliation analytics for restaurant operations.',
}

export default function Page() {
  return <AnalyticsPage />
}
