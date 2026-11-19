import type { Metadata } from 'next'
import { CameraWorkspace } from '@/components/operations/camera-workspace'
import { OperationsShell } from '@/components/layout/operations-shell'

export const metadata: Metadata = {
  title: 'Camera Operations | RADA Coffee',
  description: 'Camera wall and video operations workspace for RADA Coffee establishments.',
}

export default function CamerasPage() {
  return <OperationsShell><CameraWorkspace /></OperationsShell>
}
