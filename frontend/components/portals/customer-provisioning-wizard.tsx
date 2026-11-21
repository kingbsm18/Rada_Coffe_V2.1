'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSWRConfig } from 'swr'
import { ArrowLeft, ArrowRight, Check, CircleCheck, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { usePortalData } from '@/services/portal-data'
import { isDemoProvider } from '@/services/config'
import type { ProvisionCustomerInput } from '@/services/development-data'
import { provisionControlCustomer } from '@/services/control-api'

const steps = ['Company', 'Establishments', 'Owner account', 'Access', 'Subscription', 'Configuration', 'Review']
type Draft = ProvisionCustomerInput

const initialDraft: Draft = {
  companyName: '', identifier: '', contactName: '', contactEmail: '', phone: '', address: '', status: 'Onboarding',
  sites: [{ name: '', address: '', timezone: 'America/Toronto', hours: '07:00–21:00', status: 'Onboarding' }],
  owner: { firstName: '', lastName: '', email: '', role: 'OWNER', siteIds: [] },
  plan: 'Growth · 5 sites', startDate: '', renewalDate: '',
  onboardingConfig: { posProvider: 'Not configured', cvIntegration: 'Not configured', edgeBox: 'Not assigned', cameraSetup: 'Not configured', menuImport: 'Not started' },
}

function localDateValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

function createInitialDraft(): Draft {
  const start = new Date()
  const renewal = new Date(start)
  renewal.setFullYear(renewal.getFullYear() + 1)
  return { ...initialDraft, startDate: localDateValue(start), renewalDate: localDateValue(renewal) }
}

export function CustomerProvisioningWizard() {
  const router = useRouter()
  const { createCustomer, setActiveTenantId, setActiveSiteId, setSelectedUserId } = usePortalData()
  const { mutate } = useSWRConfig()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(createInitialDraft)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [completeTenant, setCompleteTenant] = useState<string | null>(null)
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }))

  function validateStep() {
    if (step === 0 && (!draft.companyName.trim() || !draft.contactName.trim() || !draft.contactEmail.trim() || !draft.address.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contactEmail))) return 'Add a company name, address and valid primary contact.'
    if (step === 1 && (!draft.sites.length || draft.sites.some((site) => !site.name.trim() || !site.address.trim()))) return 'Each establishment needs a name and address.'
    if (step === 2 && (!draft.owner.firstName.trim() || !draft.owner.lastName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.owner.email))) return 'Add the owner’s name and a valid invitation email.'
    if (step === 3 && !draft.owner.siteIds.length) return 'Assign the owner access to at least one establishment.'
    return ''
  }

  function advance() {
    const issue = validateStep()
    if (issue) { setError(issue); return }
    setError('')
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  async function provision() {
    setError('')
    setPending(true)
    try {
      if (!isDemoProvider()) {
        const tenant = await provisionControlCustomer(draft)
        await mutate('/v1/control/workspace')
        setCompleteTenant(tenant.name)
        return
      }
      const tenant = createCustomer(draft)
      setActiveTenantId(tenant.id)
      setActiveSiteId('all')
      setSelectedUserId(`${tenant.id}-owner`)
      setCompleteTenant(tenant.name)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Customer provisioning failed.')
    } finally {
      setPending(false)
    }
  }

  if (completeTenant) return <div className="control-page provisioning-success"><div className="success-mark"><CircleCheck /></div><div className="portal-eyebrow"><span /> {!isDemoProvider() ? 'BACKEND PROVISIONING COMPLETE' : 'DEVELOPMENT PROVISIONING COMPLETE'}</div><h1>{completeTenant} is ready</h1><p>{!isDemoProvider() ? 'The FastAPI provisioning service accepted the customer workspace request.' : `The company, ${draft.sites.length} establishment${draft.sites.length === 1 ? '' : 's'} and Owner account were added to this development workspace.`}</p><div className="provision-result-card"><span><Check /> Customer workspace created</span><span><Check /> Establishment access assigned</span>{process.env.NODE_ENV !== 'production' && <span><Check /> Owner invitation marked pending</span>}</div>{process.env.NODE_ENV !== 'production' && <div className="connection-banner invitation-banner"><span className="banner-symbol"><ShieldCheck /></span><span><strong>No password was created or sent</strong><small>The invitation is recorded as pending. FastAPI must issue and deliver a secure activation link.</small></span></div>}<div className="success-actions">{process.env.NODE_ENV !== 'production' && <Link className="primary-action" href="/business/dashboard">Open customer business preview <ArrowRight /></Link>}<Link className="business-outline-action" href="/control/customers">Return to customers</Link></div></div>

  return <div className="control-page provisioning-page">
    <div className="control-page-heading"><div><Link className="back-link" href="/control/customers"><ArrowLeft /> Customers</Link><div className="portal-eyebrow"><span /> CUSTOMER ONBOARDING</div><h1>Create customer</h1><p>Provision a separate business workspace, establishment scope and Owner invitation.</p></div><span className="wizard-environment"><i /> DEVELOPMENT</span></div>
    <section className="provisioning-card"><div className="wizard-stepper" aria-label="Customer setup progress">{steps.map((label, index) => <div className={`wizard-step ${index === step ? 'current' : index < step ? 'complete' : ''}`} key={label}><span>{index < step ? <Check /> : String(index + 1).padStart(2, '0')}</span><small>{label}</small></div>)}</div>
      <div className="wizard-step-body"><div className="wizard-step-title"><span className="panel-eyebrow">STEP {String(step + 1).padStart(2, '0')} / 07</span><h2>{steps[step]}</h2><p>{step === 0 ? 'Add the customer company and primary contact.' : step === 1 ? 'Create one or more customer establishments.' : step === 2 ? 'Prepare the initial Owner invitation. No shared password is created.' : step === 3 ? 'Grant the initial Owner establishment scope.' : step === 4 ? 'Select a plan and renewal details. Billing can be connected later.' : step === 5 ? 'Record optional integration setup. Incomplete configuration is allowed.' : 'Confirm the workspace before provisioning.'}</p></div>
        {step === 0 && <div className="wizard-fields"><label>Company name<input autoFocus value={draft.companyName} onChange={(event) => update('companyName', event.target.value)} placeholder="e.g. Northstar Cafés" /></label><label>Business identifier <span className="optional-label">Optional</span><input value={draft.identifier} onChange={(event) => update('identifier', event.target.value)} placeholder="Tax or registration number" /></label><label>Primary contact<input value={draft.contactName} onChange={(event) => update('contactName', event.target.value)} placeholder="Full name" /></label><label>Contact email<input type="email" value={draft.contactEmail} onChange={(event) => update('contactEmail', event.target.value)} placeholder="contact@company.com" /></label><label>Phone <span className="optional-label">Optional</span><input type="tel" value={draft.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+1 416 555 0100" /></label><label>Company address<input value={draft.address} onChange={(event) => update('address', event.target.value)} placeholder="Street, city, region" /></label><label>Customer status<select value={draft.status} onChange={(event) => update('status', event.target.value as Draft['status'])}><option>Onboarding</option><option>Active</option><option>Inactive</option></select></label></div>}
        {step === 1 && <div className="wizard-establishments">{draft.sites.map((site, index) => <div className="wizard-site-card" key={index}><div className="wizard-site-heading"><strong>Establishment {index + 1}</strong>{draft.sites.length > 1 && <button type="button" onClick={() => update('sites', draft.sites.filter((_, i) => i !== index))} aria-label={`Remove establishment ${index + 1}`}><Trash2 /></button>}</div><div className="wizard-fields"><label>Name<input value={site.name} onChange={(event) => update('sites', draft.sites.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} placeholder="Downtown café" /></label><label>Address<input value={site.address} onChange={(event) => update('sites', draft.sites.map((item, i) => i === index ? { ...item, address: event.target.value } : item))} placeholder="Street, city, region" /></label><label>Timezone<select value={site.timezone} onChange={(event) => update('sites', draft.sites.map((item, i) => i === index ? { ...item, timezone: event.target.value } : item))}><option>America/Toronto</option><option>America/Vancouver</option><option>America/New_York</option><option>America/Los_Angeles</option><option>Europe/London</option></select></label><label>Operating hours<input value={site.hours} onChange={(event) => update('sites', draft.sites.map((item, i) => i === index ? { ...item, hours: event.target.value } : item))} placeholder="07:00–21:00" /></label></div></div>)}<button type="button" className="add-establishment-button" onClick={() => update('sites', [...draft.sites, { name: '', address: '', timezone: 'America/Toronto', hours: '07:00–21:00', status: 'Onboarding' }])}><Plus /> Add another establishment</button></div>}
        {step === 2 && <div className="wizard-fields"><label>First name<input value={draft.owner.firstName} onChange={(event) => update('owner', { ...draft.owner, firstName: event.target.value })} placeholder="First name" /></label><label>Last name<input value={draft.owner.lastName} onChange={(event) => update('owner', { ...draft.owner, lastName: event.target.value })} placeholder="Last name" /></label><label>Owner email<input type="email" value={draft.owner.email} onChange={(event) => update('owner', { ...draft.owner, email: event.target.value })} placeholder="owner@company.com" /></label><label>Role<select value="OWNER" disabled><option>OWNER</option></select></label><div className="wizard-wide-field"><div className="connection-banner"><span className="banner-symbol"><ShieldCheck /></span><span><strong>Secure account activation only</strong><small>The backend will deliver an invitation link after email integration is connected. Never use a shared default password.</small></span></div></div></div>}
        {step === 3 && <div className="wizard-access-list"><p>Owner account access</p>{draft.sites.map((site, index) => <label key={index}><input type="checkbox" checked={draft.owner.siteIds.includes(site.name)} onChange={(event) => update('owner', { ...draft.owner, siteIds: event.target.checked ? [...draft.owner.siteIds, site.name] : draft.owner.siteIds.filter((id) => id !== site.name) })} /><span><strong>{site.name || `Establishment ${index + 1}`}</strong><small>{site.address || 'Address pending'}</small></span><span className="access-scope-pill">OWNER</span></label>)}</div>}
        {step === 4 && <div className="wizard-fields"><label>Subscription plan<select value={draft.plan} onChange={(event) => update('plan', event.target.value)}><option>Starter · 2 sites</option><option>Growth · 5 sites</option><option>Enterprise · Custom</option></select></label><label>Subscription status<select value="Onboarding" disabled><option>Onboarding</option></select></label><label>Start date<input type="date" value={draft.startDate} onChange={(event) => update('startDate', event.target.value)} /></label><label>Renewal date<input type="date" value={draft.renewalDate} onChange={(event) => update('renewalDate', event.target.value)} /></label><div className="wizard-wide-field"><div className="connection-banner"><span className="banner-symbol"><ShieldCheck /></span><span><strong>Billing is not connected</strong><small>Plan assignment is saved for development. Production subscription changes belong to the billing backend.</small></span></div></div></div>}
        {step === 5 && <div className="wizard-config-grid"><label>POS provider<select value={draft.onboardingConfig.posProvider} onChange={(event) => update('onboardingConfig', { ...draft.onboardingConfig, posProvider: event.target.value })}><option>Not configured</option><option>Square</option><option>Toast</option><option>Lightspeed</option><option>Other</option></select></label><label>CV integration<select value={draft.onboardingConfig.cvIntegration} onChange={(event) => update('onboardingConfig', { ...draft.onboardingConfig, cvIntegration: event.target.value })}><option>Not configured</option><option>RADA CV</option><option>External provider</option></select></label><label>Edge Box<select value={draft.onboardingConfig.edgeBox} onChange={(event) => update('onboardingConfig', { ...draft.onboardingConfig, edgeBox: event.target.value })}><option>Not assigned</option><option>Assigned</option></select></label><label>Camera setup<select value={draft.onboardingConfig.cameraSetup} onChange={(event) => update('onboardingConfig', { ...draft.onboardingConfig, cameraSetup: event.target.value })}><option>Not configured</option><option>Configured</option></select></label><label>Menu import<select value={draft.onboardingConfig.menuImport} onChange={(event) => update('onboardingConfig', { ...draft.onboardingConfig, menuImport: event.target.value })}><option>Not started</option><option>Complete</option></select></label><div className="wizard-wide-field"><div className="connection-banner"><span className="banner-symbol"><Check /></span><span><strong>Partial onboarding is supported</strong><small>The customer can be provisioned while integrations and cameras are still being configured.</small></span></div></div></div>}
        {step === 6 && <div className="review-summary"><div><span>Company</span><strong>{draft.companyName || '—'}</strong><small>{draft.identifier || 'No business identifier'} · {draft.contactEmail || 'No contact email'}</small></div><div><span>Establishments</span><strong>{draft.sites.length} location{draft.sites.length === 1 ? '' : 's'}</strong><small>{draft.sites.map((site) => site.name || 'Unnamed site').join(' · ')}</small></div><div><span>Initial account</span><strong>{`${draft.owner.firstName} ${draft.owner.lastName}`.trim() || 'Owner account'}</strong><small>{draft.owner.email || 'No email'} · OWNER · Invitation pending</small></div><div><span>Access scope</span><strong>{draft.owner.siteIds.length} establishment{draft.owner.siteIds.length === 1 ? '' : 's'}</strong><small>Access is assigned per customer tenant and establishment.</small></div><div><span>Subscription</span><strong>{draft.plan}</strong><small>Starts {draft.startDate || 'not set'} · renews {draft.renewalDate || 'not set'} · onboarding status</small></div><div><span>Initial integrations</span><strong>{Object.values(draft.onboardingConfig).filter((value) => !['Not configured', 'Not assigned', 'Not started'].includes(value)).length} of 5 configured</strong><small>POS {draft.onboardingConfig.posProvider} · CV {draft.onboardingConfig.cvIntegration} · camera {draft.onboardingConfig.cameraSetup}</small></div></div>}
        {error && <div className="wizard-error" role="alert">{error}</div>}
      </div>
      <div className="wizard-footer"><span><ShieldCheck /> Backend provisioning is required for production customers.</span><div>{step > 0 && <button className="wizard-back-button" onClick={() => { setError(''); setStep((current) => current - 1) }}><ArrowLeft /> Back</button>}{step < steps.length - 1 ? <button className="primary-action" onClick={advance}>Continue <ArrowRight /></button> : <button className="primary-action" onClick={provision} disabled={pending}><Check /> {pending ? 'Provisioning…' : !isDemoProvider() ? 'Provision customer' : 'Provision development workspace'}</button>}</div></div>
    </section>
    {process.env.NODE_ENV !== 'production' && <p className="wizard-disclaimer">Development data is saved in this browser only. No email is sent, and no production tenant or user is created.</p>}
  </div>
}
