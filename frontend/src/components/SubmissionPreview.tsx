import { useEffect, useState } from 'react'
import { Download, FileText, FileType, Image as ImageIcon } from 'lucide-react'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'

interface Props {
  submissionId: string
  fileType: string
  fileName: string
}

export function SubmissionPreview({ submissionId, fileType, fileName }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let createdUrl: string | null = null
    setBlobUrl(null)
    setTextContent(null)
    setError(null)

    api
      .get(`/files/submissions/${submissionId}`, { responseType: 'blob' })
      .then((r) => {
        if (cancelled) return
        const blob = r.data as Blob
        if (fileType === 'latex') {
          blob.text().then((t) => {
            if (!cancelled) setTextContent(t)
          })
          return
        }
        createdUrl = URL.createObjectURL(blob)
        setBlobUrl(createdUrl)
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Не удалось загрузить файл')
      })

    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [submissionId, fileType])

  const downloadBtn = (
    <a
      href={`/api/files/submissions/${submissionId}`}
      download={fileName}
      className="inline-flex"
    >
      <Button variant="outline" size="sm">
        <Download className="h-3.5 w-3.5" /> Скачать
      </Button>
    </a>
  )

  if (error) {
    return (
      <div className="grid h-full place-items-center rounded-md border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Не удалось открыть файл: {error}
      </div>
    )
  }

  if (fileType === 'image' && blobUrl) {
    return (
      <div className="flex h-full flex-col gap-2 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1 text-xs text-slate-500">
            <ImageIcon className="h-3.5 w-3.5" /> {fileName}
          </div>
          {downloadBtn}
        </div>
        <div className="grid flex-1 place-items-center overflow-auto rounded-md border border-slate-200 bg-slate-50">
          <img
            src={blobUrl}
            alt={fileName}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </div>
    )
  }

  if (fileType === 'pdf' && blobUrl) {
    return (
      <div className="flex h-full flex-col gap-2 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1 text-xs text-slate-500">
            <FileType className="h-3.5 w-3.5" /> {fileName}
          </div>
          {downloadBtn}
        </div>
        <iframe
          title={fileName}
          src={blobUrl}
          className="flex-1 w-full rounded-md border border-slate-200"
        />
      </div>
    )
  }

  if (fileType === 'latex' && textContent != null) {
    return (
      <div className="flex h-full flex-col gap-2 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1 text-xs text-slate-500">
            <FileText className="h-3.5 w-3.5" /> {fileName} (LaTeX)
          </div>
          {downloadBtn}
        </div>
        <pre className="flex-1 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
          {textContent}
        </pre>
      </div>
    )
  }

  // DOCX и прочее — просто карточка со скачиванием
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-6 text-center">
      <FileText className="h-10 w-10 text-slate-400" />
      <div>
        <div className="text-sm font-medium text-slate-700">{fileName}</div>
        <div className="text-xs text-slate-500">
          Превью этого типа не поддерживается напрямую. Скачайте файл, чтобы открыть.
        </div>
      </div>
      {downloadBtn}
    </div>
  )
}
