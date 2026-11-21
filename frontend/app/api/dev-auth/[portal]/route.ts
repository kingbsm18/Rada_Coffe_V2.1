import { NextRequest, NextResponse } from 'next/server'
import { authenticateDevelopmentAccount, type DevelopmentPortal } from '@/services/development-auth-adapter'
import { developmentCookieName, signDevelopmentSession, verifyDevelopmentSession } from '@/services/development-session'

const validPortal = (value: string): value is DevelopmentPortal => value === 'control' || value === 'business'
const unavailable = () => NextResponse.json({ message: 'Development authentication is unavailable.' }, { status: 404 })

export async function GET(request: NextRequest, { params }: { params: Promise<{ portal: string }> }) {
  if (process.env.NODE_ENV === 'production') return unavailable()
  const { portal: value } = await params
  if (!validPortal(value)) return NextResponse.json({ message: 'Unknown portal.' }, { status: 404 })
  const session = await verifyDevelopmentSession(request.cookies.get(developmentCookieName(value))?.value, value)
  return session ? NextResponse.json(session, { headers: { 'Cache-Control': 'no-store' } }) : NextResponse.json({ message: 'Not authenticated.' }, { status: 401 })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ portal: string }> }) {
  if (process.env.NODE_ENV === 'production') return unavailable()
  const { portal: value } = await params
  if (!validPortal(value)) return NextResponse.json({ message: 'Unknown portal.' }, { status: 404 })
  let credentials: { email?: string; password?: string }
  try { credentials = await request.json() } catch { return NextResponse.json({ message: 'Enter an email and password.' }, { status: 400 }) }
  const authenticated = authenticateDevelopmentAccount(value, credentials.email ?? '', credentials.password ?? '')
  if (!authenticated) return NextResponse.json({ message: 'Invalid email or password for this portal.' }, { status: 401 })
  const session = { ...authenticated, expiresAt: Date.now() + 1000 * 60 * 60 * 12 }
  const response = NextResponse.json(session, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(developmentCookieName(value), await signDevelopmentSession(session), { httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: 60 * 60 * 12 })
  return response
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ portal: string }> }) {
  if (process.env.NODE_ENV === 'production') return unavailable()
  const { portal: value } = await params
  if (!validPortal(value)) return NextResponse.json({ message: 'Unknown portal.' }, { status: 404 })
  const response = NextResponse.json({ signedOut: true })
  response.cookies.set(developmentCookieName(value), '', { httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: 0 })
  return response
}
