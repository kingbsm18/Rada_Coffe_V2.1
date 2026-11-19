import type { Camera, OperationsEvent, OperationalAlert, OperationsSnapshot } from '@/types/operations'

export const demoCameras: Camera[] = [
  { id: 'CAM-00184', name: 'Barista line · north', establishment: 'Rada Downtown', zone: 'BAR / FRONT', edgeDevice: 'EDGE-04', state: 'DEMO', model: 'RADA-HANDOVER v2.4.1', detectionZones: ['Counter handoff', 'Espresso station'], latestEvent: 'Physical handover · HOT_BEVERAGE' },
  { id: 'CAM-00216', name: 'Pickup counter · east', establishment: 'Rada Downtown', zone: 'PICKUP', edgeDevice: 'EDGE-04', state: 'DEMO', model: 'RADA-HANDOVER v2.4.1', detectionZones: ['Pickup shelf', 'Customer zone'], latestEvent: 'Awaiting connected edge telemetry' },
  { id: 'CAM-00341', name: 'Dining floor · wide', establishment: 'Rada West End', zone: 'DINING', edgeDevice: 'EDGE-11', state: 'DEMO', model: 'RADA-HANDOVER v2.3.8', detectionZones: ['Dining pass'], latestEvent: 'Awaiting connected edge telemetry' },
  { id: 'CAM-00402', name: 'Service pass · south', establishment: 'Rada West End', zone: 'SERVICE PASS', edgeDevice: 'EDGE-11', state: 'DEMO', model: 'RADA-HANDOVER v2.3.8', detectionZones: ['Service pass', 'Kitchen exit'], latestEvent: 'Awaiting connected edge telemetry' },
  { id: 'CAM-00518', name: 'Front counter · cam 02', establishment: 'Cedar & Stone', zone: 'COUNTER', edgeDevice: 'EDGE-18', state: 'DEMO', model: 'RADA-HANDOVER v2.4.1', detectionZones: ['Counter handoff'], latestEvent: 'Awaiting connected edge telemetry' },
  { id: 'CAM-00532', name: 'Mobile pickup · cam 01', establishment: 'Cedar & Stone', zone: 'PICKUP', edgeDevice: 'EDGE-18', state: 'DEMO', model: 'RADA-HANDOVER v2.4.1', detectionZones: ['Pickup shelf'], latestEvent: 'Awaiting connected edge telemetry' },
  { id: 'CAM-00607', name: 'Dining room · west', establishment: 'Rada Riverside', zone: 'DINING', edgeDevice: 'EDGE-22', state: 'DEMO', model: 'RADA-HANDOVER v2.4.1', detectionZones: ['Dining pass'], latestEvent: 'Awaiting connected edge telemetry' },
  { id: 'CAM-00624', name: 'Bar handoff · cam 03', establishment: 'Rada Riverside', zone: 'BAR / HANDOFF', edgeDevice: 'EDGE-22', state: 'DEMO', model: 'RADA-HANDOVER v2.4.1', detectionZones: ['Counter handoff'], latestEvent: 'Awaiting connected edge telemetry' },
  { id: 'CAM-00702', name: 'Kitchen pass · cam 01', establishment: 'Rada Uptown', zone: 'KITCHEN PASS', edgeDevice: 'EDGE-27', state: 'DEMO', model: 'RADA-HANDOVER v2.4.0', detectionZones: ['Kitchen exit'], latestEvent: 'Awaiting connected edge telemetry' },
]

export const demoEvents: OperationsEvent[] = [
  { id: 'EVT-DEMO-001', type: 'Physical handover detected', establishment: 'Rada Downtown', category: 'HOT_BEVERAGE', quantity: 1, status: 'PENDING_RECONCILIATION', timestamp: null, cameraId: 'CAM-00184', demo: true },
  { id: 'EVT-DEMO-002', type: 'POS / CV reconciliation', establishment: 'Rada Downtown', category: 'SANDWICH', quantity: 2, status: 'MATCHED', timestamp: null, cameraId: 'CAM-00216', demo: true },
  { id: 'EVT-DEMO-003', type: 'Unregistered handover', establishment: 'Rada West End', category: 'COLD_BEVERAGE', quantity: 1, status: 'UNREGISTERED_HANDOVER', timestamp: null, cameraId: 'CAM-00341', demo: true },
  { id: 'EVT-DEMO-004', type: 'POS synchronization delayed', establishment: 'Cedar & Stone', status: 'SYNC_FAILED', timestamp: null, demo: true },
  { id: 'EVT-DEMO-005', type: 'Edge device heartbeat unavailable', establishment: 'Rada Riverside', status: 'OFFLINE', timestamp: null, demo: true },
]

export const demoAlerts: OperationalAlert[] = [
  { id: 'ALT-DEMO-01', severity: 'warning', title: 'Unregistered handover', establishment: 'Rada West End', status: 'PENDING_RECONCILIATION', impact: 8.5, timestamp: null, demo: true },
  { id: 'ALT-DEMO-02', severity: 'critical', title: 'POS synchronization unavailable', establishment: 'Cedar & Stone', status: 'DATA_INCOMPLETE', timestamp: null, demo: true },
  { id: 'ALT-DEMO-03', severity: 'warning', title: 'Edge heartbeat not received', establishment: 'Rada Riverside', status: 'DEGRADED', timestamp: null, demo: true },
]

export const demoSnapshot: OperationsSnapshot = {
  source: 'demo',
  updatedAt: null,
  counts: {
    camerasOnline: 0,
    camerasTotal: demoCameras.length,
    edgeOnline: 0,
    edgeTotal: 8,
    posHealthy: 0,
    posTotal: 18,
    activeAlerts: demoAlerts.length,
    cvIngestion: 'disconnected',
  },
  cameras: demoCameras,
  events: demoEvents,
  alerts: demoAlerts,
}

export const demoAnalytics = {
  handovers: 1248,
  posDeclared: 1196,
  matched: 1124,
  unregistered: 46,
  posWithoutHandover: 28,
  pending: 72,
  estimatedDiscrepancy: 384.5,
  daily: [
    { label: 'Mon', handovers: 152, pos: 143, discrepancy: 42 },
    { label: 'Tue', handovers: 178, pos: 169, discrepancy: 31 },
    { label: 'Wed', handovers: 164, pos: 159, discrepancy: 58 },
    { label: 'Thu', handovers: 191, pos: 179, discrepancy: 46 },
    { label: 'Fri', handovers: 207, pos: 198, discrepancy: 72 },
    { label: 'Sat', handovers: 216, pos: 207, discrepancy: 84 },
    { label: 'Sun', handovers: 140, pos: 141, discrepancy: 51 },
  ],
  hourly: [
    { hour: '06:00', handovers: 18 },
    { hour: '08:00', handovers: 54 },
    { hour: '10:00', handovers: 91 },
    { hour: '12:00', handovers: 126 },
    { hour: '14:00', handovers: 112 },
    { hour: '16:00', handovers: 98 },
    { hour: '18:00', handovers: 147 },
    { hour: '20:00', handovers: 84 },
    { hour: '22:00', handovers: 22 },
  ],
  categories: [
    { category: 'HOT_BEVERAGE', handovers: 464, pos: 451, gap: 13 },
    { category: 'COLD_BEVERAGE', handovers: 233, pos: 218, gap: 15 },
    { category: 'SANDWICH', handovers: 191, pos: 184, gap: 7 },
    { category: 'DESSERT', handovers: 164, pos: 151, gap: 13 },
    { category: 'FRESH_JUICE', handovers: 102, pos: 98, gap: 4 },
  ],
  establishments: [
    { name: 'Downtown', handovers: 412, matched: 386, rate: 93.7 },
    { name: 'West End', handovers: 324, matched: 295, rate: 91.0 },
    { name: 'Cedar & Stone', handovers: 282, matched: 259, rate: 91.8 },
    { name: 'Riverside', handovers: 230, matched: 184, rate: 80.0 },
  ],
}
