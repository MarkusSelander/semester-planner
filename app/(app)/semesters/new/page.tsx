'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { BackLink } from '@/components/shared/BackLink'
import { labelClassName } from '@/lib/utils'

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
      toast.success('Semester created!')
      router.push(`/semesters/${json.data.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create semester')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-lg mx-auto">
      <BackLink href="/semesters">All semesters</BackLink>
      <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-6">New Semester</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className={labelClassName}>Name</label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spring 2025" required />
        </div>
        <div>
          <label htmlFor="startDate" className={labelClassName}>Start date</label>
          <Input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="endDate" className={labelClassName}>End date</label>
          <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create semester'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
