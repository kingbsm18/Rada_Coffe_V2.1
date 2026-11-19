import { demoAlerts, demoCameras, demoEvents } from '@/lib/demo-data/operations'

export type OperationsRecord = {
  id: string
  name: string
  location: string
  status: string
  detail: string
}

export type OperationsModule = {
  title: string
  eyebrow: string
  description: string
  records: OperationsRecord[]
}

const eventRecords: OperationsRecord[] = demoEvents.map((event) => ({
  id: event.id,
  name: event.type,
  location: event.establishment,
  status: event.status,
  detail: `${event.category ?? 'Operations'}${event.cameraId ? ` · ${event.cameraId}` : ''}`,
}))

const cameraRecords: OperationsRecord[] = demoCameras.map((camera) => ({
  id: camera.id,
  name: camera.name,
  location: `${camera.establishment} · ${camera.zone}`,
  status: camera.state,
  detail: `${camera.edgeDevice} · ${camera.model}`,
}))

const alertRecords: OperationsRecord[] = demoAlerts.map((alert) => ({
  id: alert.id,
  name: alert.title,
  location: alert.establishment,
  status: alert.status,
  detail: `${alert.severity} priority · ${alert.impact ? `$${alert.impact.toFixed(2)} estimated impact` : 'Review required'}`,
}))

const makeRecords = (rows: Array<[string, string, string, string, string]>): OperationsRecord[] => rows.map(([id, name, location, status, detail]) => ({ id, name, location, status, detail }))

export const operationsModules: Record<string, OperationsModule> = {
  live: { title: 'Live Operations', eyebrow: 'OPERATIONS', description: 'A clear view of the latest activity across the RADA network.', records: eventRecords },
  events: { title: 'Reconciliation Events', eyebrow: 'OPERATIONS', description: 'Review handover and point-of-sale events side by side.', records: eventRecords },
  alerts: { title: 'Alerts & Anomalies', eyebrow: 'OPERATIONS', description: 'Investigate exceptions that need an operator’s attention.', records: alertRecords },
  monitoring: { title: 'Platform Monitoring', eyebrow: 'SYSTEM HEALTH', description: 'Service status is shown as unavailable until a live backend is connected.', records: makeRecords([
    ['SVC-01', 'Event ingestion', 'Operations API', 'Disconnected', 'No live event stream connected'],
    ['SVC-02', 'POS synchronization', '18 integrations', 'Unavailable', 'Awaiting integration telemetry'],
    ['SVC-03', 'Edge telemetry', '8 edge devices', 'Unavailable', 'Awaiting device heartbeats'],
    ['SVC-04', 'Model inference', 'Computer vision', 'Unavailable', 'No live inference data received'],
  ]) },
  inventory: { title: 'Camera Inventory', eyebrow: 'VIDEO INFRASTRUCTURE', description: 'Browse authorized camera endpoints and their assigned zones.', records: cameraRecords },
  edge: { title: 'Edge Devices', eyebrow: 'VIDEO INFRASTRUCTURE', description: 'Review edge devices associated with camera fixtures.', records: [...new Set(demoCameras.map((camera) => camera.edgeDevice))].map((id) => ({ id, name: id, location: demoCameras.find((camera) => camera.edgeDevice === id)?.establishment ?? 'Unassigned', status: 'Demo', detail: `${demoCameras.filter((camera) => camera.edgeDevice === id).length} camera assignments · telemetry unavailable` })) },
  models: { title: 'CV Model Registry', eyebrow: 'VIDEO INFRASTRUCTURE', description: 'Review model versions referenced by camera fixtures.', records: [...new Set(demoCameras.map((camera) => camera.model))].map((name, index) => ({ id: `MODEL-${index + 1}`, name, location: 'Handover detection', status: 'Demo', detail: 'Model assignment fixture · no live inference metrics' })) },
  deployments: { title: 'Deployments', eyebrow: 'VIDEO INFRASTRUCTURE', description: 'Deployment history will appear here when connected to a live platform.', records: makeRecords([['ENV-01', 'Development preview', 'Current workspace', 'Demo', 'Preview only · no production deployment data']]) },
  customers: { title: 'Customers', eyebrow: 'BUSINESS OPERATIONS', description: 'Customer accounts represented in the current demo fixtures.', records: makeRecords([['CUS-001', 'Rada Coffee', '4 establishments', 'Demo', 'Customer fixture · account data is not connected'], ['CUS-002', 'Cedar & Stone', '1 establishment', 'Demo', 'Customer fixture · account data is not connected']]) },
  establishments: { title: 'Establishments', eyebrow: 'BUSINESS OPERATIONS', description: 'Locations represented by camera and reconciliation fixtures.', records: makeRecords([...new Set(demoCameras.map((camera) => camera.establishment))].map((name, index) => [`LOC-${String(index + 1).padStart(3, '0')}`, name, 'RADA network', 'Demo', `${demoCameras.filter((camera) => camera.establishment === name).length} camera fixtures`])) },
  products: { title: 'Menus & Products', eyebrow: 'BUSINESS OPERATIONS', description: 'Product categories observed in the illustrative event records.', records: makeRecords([...new Set(demoEvents.map((event) => event.category).filter((category): category is string => Boolean(category)))].map((name, index) => [`SKU-${String(index + 1).padStart(3, '0')}`, name.replaceAll('_', ' '), 'Menu category', 'Demo', 'Illustrative category · no connected catalog'])) },
  pos: { title: 'POS Integrations', eyebrow: 'BUSINESS OPERATIONS', description: 'Point-of-sale connection status will populate when integrations are configured.', records: makeRecords([['POS-01', 'Rada Downtown POS', 'Rada Coffee', 'Unavailable', 'Integration status not connected'], ['POS-02', 'Rada West End POS', 'Rada Coffee', 'Unavailable', 'Integration status not connected'], ['POS-03', 'Cedar & Stone POS', 'Cedar & Stone', 'Unavailable', 'Integration status not connected']]) },
  users: { title: 'Users & Permissions', eyebrow: 'BUSINESS OPERATIONS', description: 'Manage platform access after connecting the identity provider.', records: makeRecords([['USR-001', 'Workspace administrator', 'RADA AI', 'Demo', 'Role fixture · identity provider not connected']]) },
  plans: { title: 'Subscriptions & Plans', eyebrow: 'BUSINESS OPERATIONS', description: 'Subscription management will appear here when billing is connected.', records: makeRecords([['PLAN-01', 'Workspace plan', 'RADA AI', 'Not connected', 'Billing data is not available in this demo']]) },
  audit: { title: 'Audit Trail', eyebrow: 'PLATFORM', description: 'Administrative activity log for changes made in the platform.', records: makeRecords([['AUD-001', 'Demo workspace initialized', 'System', 'Demo', 'No persistent audit service is connected']]) },
  settings: { title: 'Global Settings', eyebrow: 'PLATFORM', description: 'Workspace configuration areas and their current connection state.', records: makeRecords([['SET-01', 'Operations API', 'Data connection', 'Not configured', 'Connect an API to enable live operational data'], ['SET-02', 'POS integrations', 'Business operations', 'Not configured', 'No point-of-sale credentials are connected'], ['SET-03', 'Camera streams', 'Video infrastructure', 'Authorized only', 'Preview streams require authorized endpoints'], ['SET-04', 'User access', 'Security', 'Not configured', 'Identity provider is not connected']]) },
  help: { title: 'Help & Support', eyebrow: 'PLATFORM', description: 'Find the right place to get help with your RADA operations workspace.', records: makeRecords([['HELP-01', 'Camera access', 'Video infrastructure', 'Guide', 'Only authorized stream endpoints can be shown'], ['HELP-02', 'Live data setup', 'Integrations', 'Guide', 'Connect the Operations API and POS data sources'], ['HELP-03', 'Contact support', 'Vercel support', 'Support', 'Open a support ticket at vercel.com/help']]) },
}

export function getOperationsModule(slug: string) {
  return operationsModules[slug]
}
