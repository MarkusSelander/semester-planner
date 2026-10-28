'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/field'
import { toast } from 'sonner'
import { InlineSpinner } from '@/components/shared/InlineSpinner'
import { BackLink } from '@/components/layout/PageHeader'
import { PageShell } from '@/components/layout/PageShell'

export default function NewSemesterPage() {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, startDate, endDate }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Semester created')
      router.push(`/semesters/${json.data.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create semester')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell width="narrow">
      <BackLink href="/semesters">Back</BackLink>
      <h1 className="page-title mb-8">New semester</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Spring 2026" required />
        </div>
        <div>
          <FieldLabel htmlFor="start">Start</FieldLabel>
          <Input id="start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>
        <div>
          <FieldLabel htmlFor="end">End</FieldLabel>
          <Input id="end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading} aria-busy={loading}>
            {loading ? <><InlineSpinner className="mr-1" /> Creating…</> : 'Create semester'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </PageShell>
  )
}
