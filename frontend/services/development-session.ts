import type { DevelopmentPortal, DevelopmentSession } from './development-auth-adapter'

const signingSecret = 'rada-local-development-session-only-v1'
const encoder = new TextEncoder()

function toBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function hmacKey() {
  return crypto.subtle.importKey('raw', encoder.encode(signingSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function signDevelopmentSession(session: DevelopmentSession) {
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)))
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(), encoder.encode(payload))
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`
}

export async function verifyDevelopmentSession(token: string | undefined, portal: DevelopmentPortal): Promise<DevelopmentSession | null> {
  if (!token || process.env.NODE_ENV === 'production') return null
  try {
    const [payload, signature, extra] = token.split('.')
    if (!payload || !signature || extra) return null
    const valid = await crypto.subtle.verify('HMAC', await hmacKey(), fromBase64Url(signature), encoder.encode(payload))
    if (!valid) return null
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as DevelopmentSession
    if (session.portal !== portal || session.expiresAt <= Date.now() || !session.user?.id || !session.user.role) return null
    return session
  } catch {
    return null
  }
}

export const developmentCookieName = (portal: DevelopmentPortal) => `rada_${portal}_dev_session`
