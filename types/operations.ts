export type CameraConnectionState = 'LIVE' | 'CONNECTING' | 'RECONNECTING' | 'DEGRADED' | 'OFFLINE' | 'NO_SIGNAL' | 'DEMO'

export type Camera = {
  id: string
  name: string
  establishment: string
  zone: string
  edgeDevice: string
  state: CameraConnectionState
  model: string
  detectionZones: string[]
  latestEvent?: string
  previewEndpoint?: string
}

export type ReconciliationStatus =
  | 'MATCHED'
  | 'PENDING_RECONCILIATION'
  | 'AMBIGUOUS'
  | 'DATA_INCOMPLETE'
  | 'UNREGISTERED_HANDOVER'
  | 'POS_NOT_HANDED_OVER'
  | 'VOID_AFTER_HANDOVER'
  | 'REFUND_AFTER_HANDOVER'
  | 'LATE_POS_REGISTRATION'
  | 'AUTO_RESOLVED'

export type OperationsEvent = {
  id: string
  type: string
  establishment: string
  category?: string
  quantity?: number
  status: ReconciliationStatus | 'DEGRADED' | 'OFFLINE' | 'SYNC_FAILED' | 'RECONNECTED'
  timestamp: string | null
  impact?: number
  cameraId?: string
  demo?: boolean
}

export type OperationalAlert = {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  establishment: string
  status: string
  impact?: number
  timestamp: string | null
  demo: boolean
}

export type OperationsSnapshot = {
  source: 'api' | 'demo'
  updatedAt: string | null
  counts: {
    camerasOnline: number
    camerasTotal: number
    edgeOnline: number
    edgeTotal: number
    posHealthy: number
    posTotal: number
    activeAlerts: number
    cvIngestion: 'connected' | 'degraded' | 'disconnected'
  }
  cameras: Camera[]
  events: OperationsEvent[]
  alerts: OperationalAlert[]
}

export type AnalyticsPeriod = 'today' | 'yesterday' | '7d' | '30d' | 'custom'
