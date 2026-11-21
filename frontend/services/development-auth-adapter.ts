import 'server-only'

export type DevelopmentPortal = 'control' | 'business'
export type DevelopmentSession = {
  portal: DevelopmentPortal
  user: { id: string; name: string; email: string; role: string; tenantId?: string; permissions: string[] }
  expiresAt: number
}

const developmentAccounts = {
  control: { email: 'admin@rada-ai.ma', password: '12345678', user: { id: 'dev-rada-super-admin', name: 'RADA Super Administrator', email: 'admin@rada-ai.ma', role: 'SUPER_ADMIN', permissions: ['control:*'] } },
  business: [
    { email: 'alex@radacoffee.example', password: 'business-demo', tenantId: 'tenant-rada', user: { id: 'user-rada-owner', name: 'Alex Morgan', role: 'OWNER', permissions: ['business:*'] } },
    { email: 'jordan@cedarstone.example', password: 'business-demo', tenantId: 'tenant-cedar', user: { id: 'user-cedar-owner', name: 'Jordan Lee', role: 'OWNER', permissions: ['business:*'] } },
  ],
} as const

export function authenticateDevelopmentAccount(portal: DevelopmentPortal, email: string, password: string): Omit<DevelopmentSession, 'expiresAt'> | null {
  if (process.env.NODE_ENV === 'production') return null
  const normalizedEmail = email.trim().toLowerCase()
  if (portal === 'control') {
    const account = developmentAccounts.control
    return normalizedEmail === account.email && password === account.password
      ? { portal, user: { ...account.user, permissions: [...account.user.permissions] } }
      : null
  }
  const account = developmentAccounts.business.find((candidate) => candidate.email === normalizedEmail && candidate.password === password)
  return account ? { portal, user: { ...account.user, email: account.email, tenantId: account.tenantId, permissions: [...account.user.permissions] } } : null
}

export function createDevelopmentImpersonation(tenant: { id: string; name: string; contactEmail: string } | undefined): Omit<DevelopmentSession, 'expiresAt'> | null {
  if (process.env.NODE_ENV === 'production' || !tenant) return null
  return {
    portal: 'business',
    user: { id: `dev-preview-${tenant.id}`, name: `RADA Support · ${tenant.name}`, email: tenant.contactEmail, role: 'OWNER', tenantId: tenant.id, permissions: ['business:*'] },
  }
}
