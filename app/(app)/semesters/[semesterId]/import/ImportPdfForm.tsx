'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { InlineSpinner } from '@/components/shared/InlineSpinner'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

type Course = { id: string; name: string; code: string | null }

type ImportResult = {
  eventsCreated: number
  extractionNotes?: string
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      resolve(dataUrl.slice(dataUrl.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function ImportPdfForm({
  semesterId,
  semesterName,
  courses,
}: {
  semesterId: string
  semesterName: string
  courses: Course[]
}) {
  const router = useRouter()

  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(() => courses.map(c => c.id))
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
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
      const base64 = await readFileAsBase64(file)

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
    <div className="mx-auto w-full max-w-lg px-4 py-6 md:px-8 md:py-8">
      <Link href={`/semesters/${semesterId}`} className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="page-title mb-1">Import PDF Schedule</h1>
      {semesterName && <p className="text-sm text-muted-foreground mb-6">{semesterName}</p>}

      <div className="space-y-6">
        {/* Course selection */}
        {courses.length > 0 && (
          <div>
            <p className="field-label">Map to courses</p>
            <div className="space-y-2">
              {courses.map(c => (
                <label key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/80 cursor-pointer hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={selectedCourseIds.includes(c.id)}
                    onChange={() => toggleCourse(c.id)}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {c.code && <span className="font-mono text-muted-foreground mr-2">{c.code}</span>}
                    {c.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* File drop zone */}
        <div>
          <p className="field-label">PDF file</p>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-accent bg-accent/10'
                : file
                ? 'border-done/40 bg-done/10'
                : 'border-border hover:border-foreground/30 hover:bg-muted/40'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-done">
                <FileText className="h-5 w-5" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive ? 'Drop the PDF here' : 'Drag & drop a PDF, or click to browse'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="flex items-start gap-3 rounded-sm border border-done/30 bg-done/10 p-4">
            <CheckCircle2 className="h-5 w-5 text-done flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-done">
                {result.eventsCreated} events imported successfully
              </p>
              {result.extractionNotes && (
                <p className="mt-1 text-xs text-done">{result.extractionNotes}</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-sm border border-destructive/30 bg-destructive/10 p-4">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleImport} disabled={loading || !file} aria-busy={loading}>
            {loading ? <><InlineSpinner className="mr-1" /> Importing…</> : 'Import'}
          </Button>
          {result && (
            <Button variant="outline" onClick={() => router.push(`/semesters/${semesterId}`)}>
              View semester
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
