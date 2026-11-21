export type DataProvider = 'demo' | 'api'
export type AuthenticationStrategy = 'http-only-cookie' | 'bearer'

const configuredProvider = process.env.NEXT_PUBLIC_DATA_PROVIDER ?? process.env.DATA_PROVIDER
const configuredApiUrl = process.env.NEXT_PUBLIC_RADA_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_OPERATIONS_API_URL
const configuredTimeout = Number(process.env.NEXT_PUBLIC_RADA_API_TIMEOUT_MS)

export const appConfig = Object.freeze({
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? 'development',
  apiBaseUrl: configuredApiUrl?.trim().replace(/\/+$/, '') ?? '',
  apiVersion: (process.env.NEXT_PUBLIC_RADA_API_VERSION ?? 'v1').replace(/^\/+|\/+$/g, ''),
  requestTimeoutMs: Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? Math.min(configuredTimeout, 120_000) : 12_000,
  dataProvider: (process.env.NODE_ENV === 'production' || configuredProvider === 'api' ? 'api' : 'demo') as DataProvider,
  authenticationStrategy: (process.env.NEXT_PUBLIC_RADA_AUTH_STRATEGY === 'bearer' ? 'bearer' : 'http-only-cookie') as AuthenticationStrategy,
  features: Object.freeze({
    realtime: process.env.NEXT_PUBLIC_RADA_REALTIME_ENABLED === 'true',
    cameraStreams: process.env.NEXT_PUBLIC_RADA_CAMERA_STREAMS_ENABLED === 'true',
  }),
})

export const isDemoProvider = () => appConfig.dataProvider === 'demo'
export const isApiProvider = () => appConfig.dataProvider === 'api'
export const isApiConfigured = () => Boolean(appConfig.apiBaseUrl)
