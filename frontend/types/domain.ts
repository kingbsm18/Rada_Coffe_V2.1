export type EntityId = string
export type ISODateTime = string
export type Portal = 'control' | 'business'
export type EntityStatus = 'active' | 'inactive' | 'pending' | 'provisioning' | 'degraded' | 'offline'
export type CameraStatus = 'online' | 'degraded' | 'offline' | 'unknown' | 'demo'
export type IntegrationStatus = 'connected' | 'degraded' | 'disconnected' | 'pending'
export type ReconciliationStatus = 'matched' | 'pending' | 'ambiguous' | 'data_incomplete' | 'unregistered_handover' | 'pos_not_handed_over' | 'void_after_handover' | 'refund_after_handover' | 'late_pos_registration' | 'auto_resolved'
export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface Timestamped { createdAt: ISODateTime; updatedAt: ISODateTime }
export interface PageRequest { page?: number; pageSize?: number; sort?: string; order?: 'asc' | 'desc'; search?: string }
export interface Page<T> { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number }
export interface ApiErrorBody { code: string; message: string; details?: unknown; requestId?: string }

export interface Session { id: EntityId; portal: Portal; user: BusinessUser | InternalUser; tenant?: Customer }
export interface InternalUser extends Timestamped { id: EntityId; email: string; displayName: string; role: string; permissions: string[]; status: EntityStatus }
export interface Customer extends Timestamped { id: EntityId; name: string; externalId: string; status: EntityStatus; contactEmail: string; subscriptionId?: EntityId }
export interface Establishment extends Timestamped { id: EntityId; customerId: EntityId; name: string; address: string; timezone: string; status: EntityStatus }
export interface Subscription extends Timestamped { id: EntityId; customerId: EntityId; planId: string; status: EntityStatus; startsAt: ISODateTime; renewsAt?: ISODateTime }
export interface BusinessUser extends Timestamped { id: EntityId; customerId: EntityId; email: string; displayName: string; role: string; permissions: string[]; establishmentIds: EntityId[]; status: EntityStatus }
export interface Role { id: EntityId; portal: Portal; name: string; permissions: string[] }
export interface Permission { key: string; description: string }
export interface Camera extends Timestamped { id: EntityId; establishmentId: EntityId; edgeDeviceId?: EntityId; name: string; zone: string; status: CameraStatus; streamProvider?: 'webrtc' | 'hls' | 'sse' | 'unknown'; previewEndpoint?: string }
export interface CameraStream { cameraId: EntityId; url: string; protocol: 'webrtc' | 'hls'; expiresAt: ISODateTime }
export interface CameraStreamState { cameraId: EntityId; state: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'closed'; error?: string }
export interface EdgeDevice extends Timestamped { id: EntityId; establishmentId: EntityId; name: string; status: EntityStatus; lastHeartbeatAt?: ISODateTime; version?: string }
export interface Integration extends Timestamped { id: EntityId; establishmentId: EntityId; kind: 'pos' | 'computer_vision'; provider: string; status: IntegrationStatus; lastSyncAt?: ISODateTime }
export interface CvDetection extends Timestamped { id: EntityId; cameraId: EntityId; establishmentId: EntityId; detectedAt: ISODateTime; productLabel?: string; confidence?: number; handoverEventId?: EntityId }
export interface HandoverEvent extends Timestamped { id: EntityId; establishmentId: EntityId; cameraId?: EntityId; detectedAt: ISODateTime; status: ReconciliationStatus; quantity: number }
export interface PosTransaction extends Timestamped { id: EntityId; establishmentId: EntityId; externalId: string; occurredAt: ISODateTime; amount: number; currency: string; status: string }
export interface ReconciliationRecord extends Timestamped { id: EntityId; establishmentId: EntityId; handoverEventId?: EntityId; transactionId?: EntityId; status: ReconciliationStatus; discrepancyAmount?: number }
export interface Anomaly extends Timestamped { id: EntityId; establishmentId: EntityId; reconciliationId?: EntityId; category: string; description: string; severity: AlertSeverity; status: EntityStatus }
export interface Alert extends Timestamped { id: EntityId; establishmentId: EntityId; anomalyId?: EntityId; title: string; severity: AlertSeverity; status: 'open' | 'acknowledged' | 'resolved' }
export interface Report { id: EntityId; establishmentId: EntityId; periodStart: ISODateTime; periodEnd: ISODateTime; generatedAt: ISODateTime; downloadUrl?: string }
export interface AnalyticsSummary { establishmentId: EntityId; periodStart: ISODateTime; periodEnd: ISODateTime; currency: string; posTransactionCount: number; handoverCount: number; matchedCount: number; matchRate: number; discrepancyAmount: number; series: Array<{ occurredAt: ISODateTime; posCount: number; handoverCount: number }> }
export interface SystemHealth { status: IntegrationStatus; checkedAt: ISODateTime; services: Array<{ name: string; status: IntegrationStatus; latencyMs?: number }> }
export interface AuditLog extends Timestamped { id: EntityId; actorId: EntityId; action: string; resourceType: string; resourceId: EntityId; metadata?: Record<string, unknown> }

export interface AuthCredentials { email: string; password: string }
export interface SessionResponse { session: Session; expiresAt?: ISODateTime }
export interface TenantScope { customerId: EntityId; establishmentIds?: EntityId[] }
export interface RealtimeEvent<T = unknown> { id: EntityId; type: string; occurredAt: ISODateTime; payload: T }
