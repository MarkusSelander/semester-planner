'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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
    <div className="p-8 max-w-lg mx-auto">
      <Link href="/semesters" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Semester</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spring 2025" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
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
