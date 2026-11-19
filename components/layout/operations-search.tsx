'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { operationsModules } from '@/lib/operations/modules'

const pages = [
  { title: 'Command center', href: '/superadmin/dashboard', description: 'Network overview and live operations' },
  { title: 'Camera operations', href: '/superadmin/cameras', description: 'Authorized camera streams and controls' },
  { title: 'Revenue intelligence', href: '/superadmin/analytics', description: 'POS and computer vision reconciliation' },
  ...Object.entries(operationsModules).map(([slug, module]) => ({ title: module.title, href: `/superadmin/${slug}`, description: module.description })),
]

const records = Object.entries(operationsModules)
  .filter(([slug]) => !['live', 'events'].includes(slug))
  .flatMap(([slug, module]) => module.records.map((record) => ({
    title: record.name,
    href: `/superadmin/${slug}`,
    description: `Fixture · ${record.location} · ${record.id}`,
  })))

const searchItems = [...pages, ...records]

export function OperationsSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const normalizedQuery = query.trim().toLowerCase()
  const results = useMemo(() => normalizedQuery
    ? searchItems.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(normalizedQuery)).slice(0, 6)
    : [], [normalizedQuery])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        setFocused(true)
      }
      if (event.key === 'Escape') {
        setFocused(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const openResult = (href: string) => {
    setFocused(false)
    setQuery('')
    router.push(href)
  }

  return <form className="search-box platform-search" role="search" onSubmit={(event) => { event.preventDefault(); if (results[0]) openResult(results[0].href) }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false) }}>
    <Search size={15} aria-hidden="true" />
    <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setFocused(true)} type="search" aria-label="Search pages and fixture records" aria-controls="platform-search-results" aria-expanded={focused && normalizedQuery.length > 0} placeholder="Search pages & fixture records…" autoComplete="off" />
    {query ? <button type="button" className="search-clear" aria-label="Clear search" onClick={() => { setQuery(''); inputRef.current?.focus() }}><X size={13} /></button> : <kbd>⌘ K</kbd>}
    {focused && normalizedQuery && <div className="platform-search-results" id="platform-search-results" aria-live="polite">{results.length ? results.map((item, index) => <Link href={item.href} key={`${item.href}-${item.title}-${index}`} onClick={() => { setFocused(false); setQuery('') }}><span><strong>{item.title}</strong><small>{item.description}</small></span><ArrowUpRight size={14} aria-hidden="true" /></Link>) : <p>No pages or records match “{query}”.</p>}</div>}
  </form>
}
