import { NextRequest, NextResponse } from 'next/server'
import { createDevelopmentImpersonation } from '@/services/development-auth-adapter'
import { developmentCookieName, signDevelopmentSession, verifyDevelopmentSession } from '@/services/development-session'
import { isDemoProvider } from '@/services/config'

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' || !isDemoProvider()) return NextResponse.json({ message: 'Development preview is unavailable.' }, { status: 404 })
  const admin = await verifyDevelopmentSession(request.cookies.get(developmentCookieName('control'))?.value, 'control')
  if (admin?.user.role !== 'SUPER_ADMIN') return NextResponse.json({ message: 'Super administrator access required.' }, { status: 403 })
  let tenant: { id: string; name: string; contactEmail: string }
  try { tenant = await request.json() } catch { return NextResponse.json({ message: 'Customer workspace is required.' }, { status: 400 }) }
  if (!/^tenant-[a-zA-Z0-9-]+$/.test(tenant.id) || !tenant.name || !tenant.contactEmail) return NextResponse.json({ message: 'Invalid customer workspace.' }, { status: 400 })
  const session = createDevelopmentImpersonation(tenant)
  if (!session) return NextResponse.json({ message: 'Customer workspace not found.' }, { status: 404 })
  const signed = { ...session, expiresAt: Date.now() + 1000 * 60 * 60 * 2 }
  const response = NextResponse.json({ tenantId: tenant.id })
  response.cookies.set(developmentCookieName('business'), await signDevelopmentSession(signed), { httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: 60 * 60 * 2 })
  return response
}
