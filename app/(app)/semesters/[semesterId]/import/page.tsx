'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Upload, FileText, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react'
import { BackLink } from '@/components/shared/BackLink'
import { EmptyState } from '@/components/shared/EmptyState'
import { labelClassName } from '@/lib/utils'

type Course = { id: string; name: string; code: string | null }

type ImportResult = {
  eventsCreated: number
  extractionNotes?: string
}

export default function ImportPdfPage() {
  const params = useParams()
  const semesterId = params.semesterId as string
  const router = useRouter()

  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [semesterName, setSemesterName] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/semesters/${semesterId}`)
      .then(r => r.json())
      .then(j => { if (j.data) setSemesterName(j.data.name) })
    fetch(`/api/semesters/${semesterId}/courses`)
      .then(r => r.json())
      .then(j => {
        const data: Course[] = j.data ?? []
        setCourses(data)
        setSelectedCourseIds(data.map(c => c.id))
      })
      .finally(() => setLoaded(true))
  }, [semesterId])

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: courses.length === 0,
  })

  function toggleCourse(id: string) {
    setSelectedCourseIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleImport() {
    if (!file) { toast.error('Select a PDF file'); return }
    if (selectedCourseIds.length === 0) { toast.error('Select at least one course'); return }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const buffer = await file.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(buffer).reduce((acc, byte) => acc + String.fromCharCode(byte), '')
      )

      const res = await fetch('/api/import/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semesterId,
          courseIds: selectedCourseIds,
          pdfBase64: base64,
          fileName: file.name,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setResult({ eventsCreated: json.data.eventsCreated, extractionNotes: json.data.extractionNotes })
      toast.success(`Imported ${json.data.eventsCreated} events!`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-lg mx-auto">
      <BackLink href="/semesters">All semesters</BackLink>

      <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-1">Import PDF Schedule</h1>
      {semesterName && <p className="text-sm text-slate-500 mb-6">{semesterName}</p>}

      {loaded && courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Add a course first"
          description="PDF import maps events to courses. Create at least one course in this semester before importing."
          actionLabel="Add course"
          actionHref={`/courses/new?semesterId=${semesterId}`}
        />
      ) : (
        <div className="space-y-6">
          {courses.length > 0 && (
            <div>
              <p className={labelClassName}>Map to courses</p>
              <div className="space-y-2">
                {courses.map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedCourseIds.includes(c.id)}
                      onChange={() => toggleCourse(c.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-900">
                      {c.code && <span className="font-mono text-slate-500 mr-2">{c.code}</span>}
                      {c.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className={labelClassName}>PDF file</p>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-indigo-400 bg-indigo-50'
                  : file
                  ? 'border-green-300 bg-green-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    {isDragActive ? 'Drop the PDF here' : 'Drag & drop a PDF, or click to browse'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {result && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {result.eventsCreated} events imported successfully
                </p>
                {result.extractionNotes && (
                  <p className="text-xs text-green-700 mt-1">{result.extractionNotes}</p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleImport} disabled={loading || !file || courses.length === 0}>
              {loading ? 'Importing...' : 'Import'}
            </Button>
            {result && (
              <Button variant="outline" onClick={() => router.push(`/semesters/${semesterId}`)}>
                View semester
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
