import type { Alert, AnalyticsSummary, AuditLog, BusinessUser, Camera, CameraStream, Customer, CvDetection, EdgeDevice, Establishment, Integration, Page, PageRequest, PosTransaction, ReconciliationRecord, Report, Session, Subscription, SystemHealth, InternalUser } from '@/types/domain'

export interface AuthService { session(portal: 'control' | 'business', signal?: AbortSignal): Promise<Session | null>; signIn(portal: 'control' | 'business', credentials: { email: string; password: string }): Promise<Session>; signOut(portal: 'control' | 'business'): Promise<void> }
export interface CustomerService { list(query?: PageRequest, signal?: AbortSignal): Promise<Page<Customer>>; get(id: string, signal?: AbortSignal): Promise<Customer>; create(input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>; update(id: string, input: Partial<Customer>): Promise<Customer> }
export interface EstablishmentService { list(customerId: string, query?: PageRequest, signal?: AbortSignal): Promise<Page<Establishment>>; get(id: string, signal?: AbortSignal): Promise<Establishment> }
export interface CameraService { list(establishmentId: string, signal?: AbortSignal): Promise<Camera[]>; resolveStream(cameraId: string, signal?: AbortSignal): Promise<CameraStream> }
export interface DeviceService { list(establishmentId?: string, signal?: AbortSignal): Promise<EdgeDevice[]> }
export interface UserService { list(portal: 'control' | 'business', scope?: { customerId?: string }, query?: PageRequest, signal?: AbortSignal): Promise<Page<InternalUser | BusinessUser>> }
export interface SubscriptionService { list(customerId?: string, signal?: AbortSignal): Promise<Subscription[]>; update(id: string, input: Partial<Subscription>): Promise<Subscription> }
export interface AnalyticsService { summary(scope: { establishmentIds?: string[]; from?: string; to?: string }, signal?: AbortSignal): Promise<AnalyticsSummary[]> }
export interface CvDetectionService { list(establishmentId: string, query?: PageRequest, signal?: AbortSignal): Promise<Page<CvDetection>> }
export interface PosTransactionService { list(establishmentId: string, query?: PageRequest, signal?: AbortSignal): Promise<Page<PosTransaction>> }
export interface ReconciliationService { list(scope: { establishmentIds?: string[] }, query?: PageRequest, signal?: AbortSignal): Promise<Page<ReconciliationRecord>>; updateStatus(id: string, status: string): Promise<ReconciliationRecord> }
export interface AlertService { list(scope: { establishmentIds?: string[] }, query?: PageRequest, signal?: AbortSignal): Promise<Page<Alert>>; acknowledge(id: string): Promise<Alert> }
export interface ReportService { list(query?: PageRequest, signal?: AbortSignal): Promise<Page<Report>>; download(id: string, signal?: AbortSignal): Promise<Blob> }
export interface IntegrationService { list(establishmentId: string, signal?: AbortSignal): Promise<Integration[]> }
export interface MonitoringService { health(signal?: AbortSignal): Promise<SystemHealth> }
export interface AuditService { list(query?: PageRequest, signal?: AbortSignal): Promise<Page<AuditLog>> }

export interface PortalServices { auth: AuthService; customers: CustomerService; establishments: EstablishmentService; cameras: CameraService; devices: DeviceService; users: UserService; subscriptions: SubscriptionService; analytics: AnalyticsService; cvDetections: CvDetectionService; posTransactions: PosTransactionService; reconciliation: ReconciliationService; alerts: AlertService; reports: ReportService; integrations: IntegrationService; monitoring: MonitoringService; audit: AuditService }
