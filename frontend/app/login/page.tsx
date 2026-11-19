'use client'

import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { signIn } from '@/services/auth'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); return }
    if (!password) { setError('Enter your password.'); return }
    setBusy(true)
    try { await signIn({ email: email.trim(), password }); window.location.assign('/superadmin/dashboard') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to sign in. Please try again.') }
    finally { setBusy(false) }
  }
  return <main className="login-page"><div className="login-orb login-orb-one"/><div className="login-orb login-orb-two"/><div className="login-wrap"><a className="login-brand" href="/"><span className="login-brand-mark"><img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rada_l%20%281%29-qHvP7Now8jrOtkv0HuBctgDGewTnTl.jpg" alt="" aria-hidden="true" /></span><span>RADA<span>.</span></span></a><section className="login-card"><div className="login-icon"><LockKeyhole size={20}/></div><div className="login-eyebrow">ADMINISTRATOR ACCESS</div><h1>Welcome back</h1><p className="login-subtitle">Sign in to your RADA Coffee control center.</p><form onSubmit={handleSubmit} noValidate><label htmlFor="login-email">Email address</label><input id="login-email" type="email" autoComplete="username" placeholder="you@company.com" value={email} onChange={(event)=>setEmail(event.target.value)} /><div className="password-label"><label htmlFor="login-password">Password</label><a href="mailto:support@rada.ai?subject=Password%20reset">Forgot password?</a></div><div className="password-input-wrap"><input id="login-password" type={showPassword?'text':'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event)=>setPassword(event.target.value)} /><button type="button" aria-label={showPassword?'Hide password':'Show password'} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div><label className="remember-label"><input type="checkbox"/>Remember me</label>{error&&<div role="alert" className="login-error">{error}</div>}<button className="login-submit" type="submit" disabled={busy}>{busy?'Connecting...':'Sign in'}{!busy&&<ArrowRight size={15}/>}</button></form><div className="login-security"><ShieldCheck size={14}/>Secure administrator access<span>·</span>Backend authentication required</div></section><div className="login-footer">© 2026 RADA AI <span>·</span> RADA COFFEE V2.0</div></div></main>
}
