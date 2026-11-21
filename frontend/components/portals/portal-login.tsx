'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Coffee, LockKeyhole, ShieldCheck } from 'lucide-react'
import { signInToPortal, type PortalKind } from '@/services/portal-auth'
import { isDemoProvider } from '@/services/config'

export function PortalLogin({ portal }: { portal: PortalKind }) {
  const control = portal === 'control'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid work email.'); return }
    if (!password) { setError('Enter your password.'); return }
    setPending(true)
    try {
      const session = await signInToPortal(portal, email.trim(), password)
      if (session.portal !== portal) throw new Error('This account is not authorized for this portal.')
      window.location.assign(control ? '/control/dashboard' : '/business/dashboard')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed. Try again.')
    } finally { setPending(false) }
  }

  return <main className={`portal-login-page ${control ? 'control-login' : 'business-login'}`}>
    <div className="login-ambient" aria-hidden="true"><span /><span /><span /></div>
    <section className="portal-login-card">
      <Link className="login-product-brand" href={control ? '/control/login' : '/business/login'}><span><Coffee /></span><strong>RADA<span>.</span></strong><small>{control ? 'CONTROL' : 'COFFEE BUSINESS'}</small></Link>
      <div className="login-access-icon">{control ? <ShieldCheck /> : <LockKeyhole />}</div>
      <div className="login-eyebrow">{control ? 'INTERNAL PLATFORM ACCESS' : 'CUSTOMER WORKSPACE'}</div>
      <h1>{control ? 'RADA Control' : 'Your business, in view.'}</h1>
      <p>{control ? 'A secure workspace for RADA platform operations, engineering and support.' : 'Sign in to your authorized café operations workspace.'}</p>
      <form onSubmit={submit} noValidate>
        <label htmlFor={`${portal}-email`}>Work email</label>
        <input id={`${portal}-email`} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
        <label htmlFor={`${portal}-password`}>Password</label>
        <input id={`${portal}-password`} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
        {error && <div className="portal-login-error" role="alert">{error}</div>}
        <button className="portal-login-submit" disabled={pending}>{pending ? 'Signing in…' : 'Continue'}<ArrowRight /></button>
      </form>
      <div className="login-boundary-note"><LockKeyhole /> {isDemoProvider() && process.env.NODE_ENV !== 'production' ? 'Development credentials are validated by the local auth adapter.' : 'Authentication and permissions are verified by the RADA API.'}</div>
      {isDemoProvider() && process.env.NODE_ENV !== 'production' && <div className="demo-credentials"><strong>{control ? 'Development administrator' : 'Customer demo accounts'}</strong>{control ? <><span>admin@rada-ai.ma</span><span>12345678</span></> : <><span>alex@radacoffee.example · RADA Coffee</span><span>jordan@cedarstone.example · Cedar & Stone</span><span>Password: business-demo</span></>}</div>}
    </section>
    <p className="portal-login-footer">{control ? 'For authorized RADA personnel only.' : 'Your organization’s data is isolated to your authorized access.'} <span>·</span> Development preview contains fixture data.</p>
  </main>
}
