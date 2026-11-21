'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Plus, Save, Trash2, UserPlus } from 'lucide-react'
import { usePortalData } from '@/services/portal-data'
import type { BusinessCamera, OnboardingConfig, Site, Tenant, TenantUser } from '@/services/development-data'
import { isDemoProvider } from '@/services/config'
import { DataConnectionNotice } from './data-connection-notice'
import { useControlWorkspace } from '@/services/portal-hooks'

const roles: TenantUser['role'][] = ['OWNER', 'COMPANY_EXECUTIVE', 'MANAGER', 'OPERATIONS_MANAGER', 'ESTABLISHMENT_MANAGER', 'STAFF']

const defaultOnboardingConfig: OnboardingConfig = { posProvider: 'Not configured', cvIntegration: 'Not configured', edgeBox: 'Not assigned', cameraSetup: 'Not configured', menuImport: 'Not started' }
type TenantForm = Pick<Tenant, 'name' | 'identifier' | 'contactName' | 'contactEmail' | 'phone' | 'address' | 'plan' | 'subscriptionStartDate' | 'renewalDate' | 'subscriptionStatus' | 'provisioningStatus' | 'onboardingConfig'>
const toForm = (tenant: Tenant): TenantForm => ({ name: tenant.name, identifier: tenant.identifier, contactName: tenant.contactName, contactEmail: tenant.contactEmail, phone: tenant.phone, address: tenant.address, plan: tenant.plan, subscriptionStartDate: tenant.subscriptionStartDate ?? '', renewalDate: tenant.renewalDate, subscriptionStatus: tenant.subscriptionStatus ?? 'Trial', provisioningStatus: tenant.provisioningStatus ?? 'In progress', onboardingConfig: tenant.onboardingConfig ?? defaultOnboardingConfig })

export function CustomerDetailPage({ customerId }: { customerId: string }) {
  const router = useRouter()
  const { tenants, users, cameras, updateCustomer, deleteCustomer, setCustomerStatus, addEstablishment, updateEstablishment, deleteEstablishment, addCustomerUser, updateCustomerUser, addCamera, updateCamera, deleteCamera } = usePortalData()
  const development = isDemoProvider()
  const { data: workspace, error } = useControlWorkspace()
  const tenant = development ? tenants.find((item) => item.id === customerId) : workspace?.customers.find((item) => item.id === customerId)
  const members = users.filter((user) => user.tenantId === customerId)
  const [form, setForm] = useState<TenantForm | null>(tenant ? toForm(tenant) : null)
  const [siteEdits, setSiteEdits] = useState<Record<string, Partial<Site>>>({})
  const [siteDraft, setSiteDraft] = useState({ name: '', address: '', timezone: 'America/Toronto', hours: '07:00–21:00' })
  const [cameraDraft, setCameraDraft] = useState({ siteId: '', name: '', zone: 'Handover zone' })
  const [userDraft, setUserDraft] = useState({ firstName: '', lastName: '', email: '', role: 'MANAGER' as TenantUser['role'], siteIds: [] as string[] })
  const [notice, setNotice] = useState('')
  const [issue, setIssue] = useState('')

  useEffect(() => { if (tenant) setForm(toForm(tenant)) }, [tenant])
  const businessUsers = useMemo(() => members.filter((member) => member.status === 'Active' || member.status === 'Invitation pending'), [members])

  if (!tenant || !form) return <div className="control-page"><DataConnectionNotice error={error} /><Link className="back-link" href="/control/customers"><ArrowLeft /> Customers</Link><h1>Customer not found</h1><p>This customer may have been removed or is not available in this workspace.</p></div>

  function updateForm<K extends keyof TenantForm>(key: K, value: TenantForm[K]) {
    setForm((current) => current ? { ...current, [key]: value } : current)
  }

  function saveCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form?.name.trim() || !form.contactName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) { setIssue('Enter a customer name, contact name and valid contact email.'); return }
    if (development) updateCustomer(customerId, { ...form, name: form.name.trim(), identifier: form.identifier.trim(), contactName: form.contactName.trim(), contactEmail: form.contactEmail.trim() })
    setIssue('')
    setNotice('Customer details saved locally.')
  }

  function saveSite(site: Site) {
    if (!development) return
    const changes = siteEdits[site.id] ?? {}
    if (!(changes.name ?? site.name).trim() || !(changes.address ?? site.address).trim()) { setIssue('Every establishment needs a name and address.'); return }
    updateEstablishment(customerId, site.id, changes)
    setSiteEdits((current) => { const next = { ...current }; delete next[site.id]; return next })
    setIssue('')
    setNotice('Establishment updated locally.')
  }

  function createSite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!siteDraft.name.trim() || !siteDraft.address.trim()) { setIssue('Enter an establishment name and address.'); return }
    if (development) addEstablishment(customerId, { ...siteDraft, status: 'Onboarding' })
    setSiteDraft({ name: '', address: '', timezone: 'America/Toronto', hours: '07:00–21:00' })
    setIssue('')
    setNotice('Establishment added locally.')
  }

  function createCamera(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cameraDraft.name.trim() || !cameraDraft.siteId) { setIssue('Choose an establishment and enter a camera name.'); return }
    if (development) addCamera(customerId, { ...cameraDraft, name: cameraDraft.name.trim(), status: 'Offline', lastFrame: 'Never' })
    setCameraDraft({ siteId: '', name: '', zone: 'Handover zone' })
    setIssue('')
    setNotice('Camera endpoint added locally. No stream is connected.')
  }

  function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userDraft.firstName.trim() || !userDraft.lastName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDraft.email)) { setIssue('Enter a full name and valid user email.'); return }
    if (!userDraft.siteIds.length) { setIssue('Assign this user to at least one establishment.'); return }
    if (development) addCustomerUser(customerId, { ...userDraft, firstName: userDraft.firstName.trim(), lastName: userDraft.lastName.trim(), email: userDraft.email.trim(), status: 'Invitation pending' })
    setUserDraft({ firstName: '', lastName: '', email: '', role: 'MANAGER', siteIds: [] })
    setIssue('')
    setNotice('User invitation added to local data. No email was sent.')
  }

  async function openBusinessWorkspace() {
    setIssue('')
    if (!development) { setIssue('Customer workspace switching will be available through the connected RADA API.'); return }
    const currentTenant = tenant
    if (!currentTenant) return
    const response = await fetch('/api/dev-auth/impersonate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: currentTenant.id, name: currentTenant.name, contactEmail: currentTenant.contactEmail }) })
    const payload = await response.json()
    if (!response.ok) { setIssue(payload.message ?? 'Could not open this customer workspace.'); return }
    window.location.assign('/business/dashboard')
  }

  function removeCustomer() {
    const currentTenant = tenant
    if (!currentTenant || !window.confirm(`Delete ${currentTenant.name}? This also removes its users, cameras, events and snapshot data from local development storage.`)) return
    if (development) deleteCustomer(customerId)
    router.push('/control/customers')
  }

  const siteOptions = tenant.sites
  return <div className="control-page customer-detail-page">
    <DataConnectionNotice error={error} />
    <div className="customer-detail-heading"><div><Link className="back-link" href="/control/customers"><ArrowLeft /> Customers</Link><div className="portal-eyebrow"><span /> CUSTOMER PROFILE</div><h1>{tenant.name}</h1><p>{tenant.identifier || 'No business identifier'} · {tenant.contactEmail}</p></div><div className="customer-detail-actions"><button className="business-outline-action" onClick={() => void openBusinessWorkspace()}><ExternalLink /> Open Business workspace</button><button className="danger-action" onClick={removeCustomer}><Trash2 /> Delete customer</button></div></div>
    {development && <div className="local-mode-note"><span>LOCAL DATA</span> Changes are saved in this browser only. No server is connected.</div>}
    {notice && <p className="form-success" role="status">{notice}</p>}
    {issue && <p className="form-error" role="alert">{issue}</p>}
    <form className="customer-detail-section" onSubmit={saveCustomer}>
      <div className="detail-section-heading"><div><span className="panel-eyebrow">CUSTOMER INFORMATION</span><h2>Company profile</h2></div><button className="primary-action" type="submit"><Save /> Save changes</button></div>
      <div className="customer-edit-grid">
        <label>Company name<input value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></label>
        <label>Business identifier<input value={form.identifier} onChange={(event) => updateForm('identifier', event.target.value)} /></label>
        <label>Primary contact<input value={form.contactName} onChange={(event) => updateForm('contactName', event.target.value)} /></label>
        <label>Contact email<input type="email" value={form.contactEmail} onChange={(event) => updateForm('contactEmail', event.target.value)} /></label>
        <label>Phone<input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} /></label>
        <label>Company address<input value={form.address} onChange={(event) => updateForm('address', event.target.value)} /></label>
        <label>Customer status<select value={tenant.status} onChange={(event) => { const status = event.target.value as Tenant['status']; setCustomerStatus(customerId, status); setNotice(`Customer ${status.toLowerCase()} status saved locally.`) }}><option>Active</option><option>Onboarding</option><option>Inactive</option></select></label>
      </div>
    </form>

    <section className="customer-detail-section">
      <div className="detail-section-heading"><div><span className="panel-eyebrow">SUBSCRIPTION & PROVISIONING</span><h2>Service status</h2></div><button className="business-outline-action" onClick={() => { if (development) updateCustomer(customerId, { plan: form.plan, subscriptionStartDate: form.subscriptionStartDate, renewalDate: form.renewalDate, subscriptionStatus: form.subscriptionStatus, provisioningStatus: form.provisioningStatus, onboardingConfig: form.onboardingConfig ?? defaultOnboardingConfig }); setNotice(development ? 'Subscription and onboarding status saved locally.' : 'Connect the RADA API to save subscription changes.') }}><Save /> Save subscription</button></div>
      <div className="customer-edit-grid">
        <label>Subscription plan<select value={form.plan} onChange={(event) => updateForm('plan', event.target.value)}><option>Starter · 2 sites</option><option>Growth · 5 sites</option><option>Enterprise · Custom</option></select></label>
        <label>Subscription status<select value={form.subscriptionStatus} onChange={(event) => updateForm('subscriptionStatus', event.target.value as TenantForm['subscriptionStatus'])}><option>Trial</option><option>Active</option><option>Past due</option><option>Cancelled</option></select></label>
        <label>Start date<input type="date" value={form.subscriptionStartDate} onChange={(event) => updateForm('subscriptionStartDate', event.target.value)} /></label>
        <label>Renewal date<input type="date" value={form.renewalDate} onChange={(event) => updateForm('renewalDate', event.target.value)} /></label>
        <label>Onboarding status<select value={form.provisioningStatus} onChange={(event) => updateForm('provisioningStatus', event.target.value as TenantForm['provisioningStatus'])}><option>In progress</option><option>Ready</option><option>Blocked</option></select></label>
        <label>POS provider<select value={form.onboardingConfig?.posProvider ?? 'Not configured'} onChange={(event) => updateForm('onboardingConfig', { ...(form.onboardingConfig ?? defaultOnboardingConfig), posProvider: event.target.value })}><option>Not configured</option><option>Square</option><option>Toast</option><option>Lightspeed</option><option>Other</option></select></label>
        <label>CV integration<select value={form.onboardingConfig?.cvIntegration ?? 'Not configured'} onChange={(event) => updateForm('onboardingConfig', { ...(form.onboardingConfig ?? defaultOnboardingConfig), cvIntegration: event.target.value })}><option>Not configured</option><option>RADA CV</option><option>External provider</option></select></label>
        <label>Edge Box<select value={form.onboardingConfig?.edgeBox ?? 'Not assigned'} onChange={(event) => updateForm('onboardingConfig', { ...(form.onboardingConfig ?? defaultOnboardingConfig), edgeBox: event.target.value })}><option>Not assigned</option><option>Assigned</option></select></label>
        <label>Camera setup<select value={form.onboardingConfig?.cameraSetup ?? 'Not configured'} onChange={(event) => updateForm('onboardingConfig', { ...(form.onboardingConfig ?? defaultOnboardingConfig), cameraSetup: event.target.value })}><option>Not configured</option><option>Configured</option></select></label>
        <label>Menu import<select value={form.onboardingConfig?.menuImport ?? 'Not started'} onChange={(event) => updateForm('onboardingConfig', { ...(form.onboardingConfig ?? defaultOnboardingConfig), menuImport: event.target.value })}><option>Not started</option><option>Complete</option></select></label>
      </div>
    </section>

    <section className="customer-detail-section">
      <div className="detail-section-heading"><div><span className="panel-eyebrow">ESTABLISHMENTS</span><h2>{tenant.sites.length} locations</h2></div></div>
      <div className="establishment-admin-list">{tenant.sites.map((site) => {
        const values = { ...site, ...siteEdits[site.id] }
        return <article className="establishment-admin-row" key={site.id}><div className="customer-edit-grid">
          <label>Establishment name<input value={values.name} onChange={(event) => setSiteEdits((current) => ({ ...current, [site.id]: { ...current[site.id], name: event.target.value } }))} /></label>
          <label>Address<input value={values.address} onChange={(event) => setSiteEdits((current) => ({ ...current, [site.id]: { ...current[site.id], address: event.target.value } }))} /></label>
          <label>Timezone<input value={values.timezone} onChange={(event) => setSiteEdits((current) => ({ ...current, [site.id]: { ...current[site.id], timezone: event.target.value } }))} /></label>
          <label>Operating hours<input value={values.hours} onChange={(event) => setSiteEdits((current) => ({ ...current, [site.id]: { ...current[site.id], hours: event.target.value } }))} /></label>
          <label>Status<select value={values.status} onChange={(event) => setSiteEdits((current) => ({ ...current, [site.id]: { ...current[site.id], status: event.target.value as Site['status'] } }))}><option>Active</option><option>Onboarding</option><option>Inactive</option></select></label>
        </div><div className="establishment-actions"><button className="business-outline-action" onClick={() => saveSite(site)}><Save /> Save location</button><button className="danger-action" onClick={() => { if (window.confirm(`Remove ${site.name} and its assigned mock data?`)) { deleteEstablishment(customerId, site.id); setNotice('Establishment and related local data removed.') } }}><Trash2 /> Remove</button></div></article>
      })}</div>
      <form className="admin-inline-form" onSubmit={createSite}><h3><Plus /> Add establishment</h3><div className="customer-edit-grid"><label>Name<input value={siteDraft.name} onChange={(event) => setSiteDraft({ ...siteDraft, name: event.target.value })} /></label><label>Address<input value={siteDraft.address} onChange={(event) => setSiteDraft({ ...siteDraft, address: event.target.value })} /></label><label>Timezone<input value={siteDraft.timezone} onChange={(event) => setSiteDraft({ ...siteDraft, timezone: event.target.value })} /></label><label>Operating hours<input value={siteDraft.hours} onChange={(event) => setSiteDraft({ ...siteDraft, hours: event.target.value })} /></label></div><button className="business-outline-action" type="submit" disabled={!development}><Plus /> Add location</button></form>
    </section>

    <section className="customer-detail-section">
      <div className="detail-section-heading"><div><span className="panel-eyebrow">CAMERA ENDPOINTS</span><h2>{cameras.filter((camera) => camera.tenantId === customerId).length} cameras</h2></div></div>
      <div className="control-table-wrap"><table className="portal-table"><thead><tr><th>Camera</th><th>Establishment</th><th>Zone</th><th>Connection</th><th /></tr></thead><tbody>{cameras.filter((camera) => camera.tenantId === customerId).map((camera) => <tr key={camera.id}><td><input aria-label={`Camera name ${camera.id}`} className="compact-table-input" value={camera.name} onChange={(event) => updateCamera(customerId, camera.id, { name: event.target.value })} /></td><td><select aria-label={`Establishment for ${camera.name}`} className="compact-table-input" value={camera.siteId} onChange={(event) => updateCamera(customerId, camera.id, { siteId: event.target.value })}>{tenant.sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></td><td><input aria-label={`Zone for ${camera.name}`} className="compact-table-input" value={camera.zone} onChange={(event) => updateCamera(customerId, camera.id, { zone: event.target.value })} /></td><td><select aria-label={`Connection status for ${camera.name}`} className="compact-table-input" value={camera.status} onChange={(event) => updateCamera(customerId, camera.id, { status: event.target.value as BusinessCamera['status'] })}><option>Online</option><option>Degraded</option><option>Offline</option></select></td><td><button className="danger-action" aria-label={`Remove ${camera.name}`} onClick={() => { if (window.confirm(`Remove camera ${camera.name}?`)) { deleteCamera(customerId, camera.id); setNotice('Camera endpoint removed from local data.') } }}><Trash2 /></button></td></tr>)}</tbody></table></div>
      <form className="admin-inline-form" onSubmit={createCamera}><h3><Plus /> Register camera</h3><div className="customer-edit-grid"><label>Establishment<select value={cameraDraft.siteId} onChange={(event) => setCameraDraft({ ...cameraDraft, siteId: event.target.value })}><option value="">Select a location</option>{tenant.sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label><label>Camera name<input value={cameraDraft.name} onChange={(event) => setCameraDraft({ ...cameraDraft, name: event.target.value })} /></label><label>Zone<input value={cameraDraft.zone} onChange={(event) => setCameraDraft({ ...cameraDraft, zone: event.target.value })} /></label></div><button className="business-outline-action" type="submit" disabled={!development || tenant.sites.length === 0}><Plus /> Add camera</button></form>
    </section>

    <section className="customer-detail-section">
      <div className="detail-section-heading"><div><span className="panel-eyebrow">CUSTOMER ACCESS</span><h2>{businessUsers.length} users</h2></div></div>
      <div className="control-table-wrap"><table className="portal-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Establishments</th><th>Status</th></tr></thead><tbody>{businessUsers.map((member) => <tr key={member.id}><td>{member.firstName} {member.lastName}</td><td>{member.email}</td><td><select aria-label={`Role for ${member.firstName} ${member.lastName}`} value={member.role} onChange={(event) => updateCustomerUser(customerId, member.id, { role: event.target.value as TenantUser['role'] })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></td><td><div className="site-assignment-list">{siteOptions.map((site) => <label key={site.id}><input type="checkbox" checked={member.siteIds.includes(site.id)} onChange={(event) => updateCustomerUser(customerId, member.id, { siteIds: event.target.checked ? [...member.siteIds, site.id] : member.siteIds.filter((siteId) => siteId !== site.id) })} />{site.name}</label>)}</div></td><td><select aria-label={`Status for ${member.firstName} ${member.lastName}`} value={member.status} onChange={(event) => updateCustomerUser(customerId, member.id, { status: event.target.value as TenantUser['status'] })}><option>Active</option><option>Invitation pending</option></select></td></tr>)}</tbody></table></div>
      <form className="admin-inline-form" onSubmit={createUser}><h3><UserPlus /> Add customer user</h3><div className="customer-edit-grid"><label>First name<input value={userDraft.firstName} onChange={(event) => setUserDraft({ ...userDraft, firstName: event.target.value })} /></label><label>Last name<input value={userDraft.lastName} onChange={(event) => setUserDraft({ ...userDraft, lastName: event.target.value })} /></label><label>Email<input type="email" value={userDraft.email} onChange={(event) => setUserDraft({ ...userDraft, email: event.target.value })} /></label><label>Role<select value={userDraft.role} onChange={(event) => setUserDraft({ ...userDraft, role: event.target.value as TenantUser['role'] })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label><fieldset className="site-assignment-field"><legend>Establishment access</legend>{siteOptions.map((site) => <label key={site.id}><input type="checkbox" checked={userDraft.siteIds.includes(site.id)} onChange={(event) => setUserDraft((current) => ({ ...current, siteIds: event.target.checked ? [...current.siteIds, site.id] : current.siteIds.filter((id) => id !== site.id) }))} />{site.name}</label>)}</fieldset></div><button className="business-outline-action" type="submit" disabled={!development}><UserPlus /> Create invitation</button></form>
    </section>
  </div>
}
