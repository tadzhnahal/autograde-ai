import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Upload } from 'lucide-react'
import { studentApi } from '@/api/endpoints'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'
import type { SubmissionStatus } from '@/types/api'

export function StudentGroupPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const queryClient = useQueryClient()
  const [submitFor, setSubmitFor] = useState<{ id: string; title: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['student-group', groupId],
    queryFn: () => studentApi.getGroup(groupId!),
    enabled: !!groupId,
    refetchInterval: (q) => {
      const items = q.state.data?.assignments ?? []
      const polling = items.some(
        (a) =>
          a.submission &&
          (['pending', 'grading'] as SubmissionStatus[]).includes(
            a.submission.status,
          ),
      )
      return polling ? 3000 : false
    },
  })

  if (isLoading) {
    return <Skeleton className="h-32" />
  }
  if (!data) {
    return <div className="text-sm text-slate-500">Группа не найдена.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/student"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Назад к курсам
        </Link>
        <div className="mt-2 flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{data.name}</h1>
          <Badge>Шкала {data.grade_scale}</Badge>
        </div>
        {data.description && (
          <p className="mt-1 text-sm text-slate-500">{data.description}</p>
        )}
        {data.teacher && (
          <p className="mt-2 text-xs text-slate-500">
            Преподаватель:{' '}
            <span className="font-medium text-slate-700">
              {data.teacher.full_name}
            </span>{' '}
            · {data.teacher.email}
          </p>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Задания
        </h2>
        {data.assignments.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-slate-500">
              Заданий пока нет.
            </CardContent>
          </Card>
        )}

        {data.assignments.map((a) => {
          const s = a.submission
          return (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-semibold text-slate-900">
                        {a.title}
                      </div>
                      {s ? <StatusBadge status={s.status} /> : <Badge>К сдаче</Badge>}
                    </div>
                    {a.description && (
                      <p className="mt-1 text-sm text-slate-600">{a.description}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      Дедлайн: {formatDate(a.due_date)} · максимум {a.max_score} баллов
                    </p>

                    {s && s.status === 'graded' && s.final_score != null && (
                      <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                        <div className="font-semibold">
                          Оценка: {s.final_score} / {a.max_score}
                        </div>
                        {s.teacher_feedback && (
                          <p className="mt-1 text-emerald-800">{s.teacher_feedback}</p>
                        )}
                      </div>
                    )}
                    {s && s.status === 'revision' && (
                      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <div className="font-semibold">Отправлено на доработку</div>
                        {s.teacher_feedback && (
                          <p className="mt-1">{s.teacher_feedback}</p>
                        )}
                      </div>
                    )}
                    {s &&
                      (s.status === 'pending' ||
                        s.status === 'grading' ||
                        s.status === 'ai_graded') && (
                        <p className="mt-3 text-xs text-slate-500">
                          Файл: {s.file_name} · загружено {formatDate(s.submitted_at)}
                        </p>
                      )}
                  </div>

                  {(!s ||
                    s.status === 'revision' ||
                    s.status === 'pending' ||
                    s.status === 'error') && (
                    <Button
                      onClick={() => setSubmitFor({ id: a.id, title: a.title })}
                    >
                      <Upload className="h-4 w-4" />
                      {s ? 'Сдать заново' : 'Сдать работу'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      {submitFor && (
        <SubmitDialog
          assignmentId={submitFor.id}
          title={submitFor.title}
          onClose={() => setSubmitFor(null)}
          onDone={() => {
            setSubmitFor(null)
            queryClient.invalidateQueries({ queryKey: ['student-group', groupId] })
            queryClient.invalidateQueries({ queryKey: ['student-dashboard'] })
          }}
        />
      )}
    </div>
  )
}

function SubmitDialog({
  assignmentId,
  title,
  onClose,
  onDone,
}: {
  assignmentId: string
  title: string
  onClose: () => void
  onDone: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const mut = useMutation({
    mutationFn: () => studentApi.submit(assignmentId, file!, notes),
    onSuccess: () => onDone(),
  })

  const errMsg =
    (mut.error as any)?.response?.data?.detail ?? (mut.error as any)?.message

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Сдать: {title}</DialogTitle>
          <DialogDescription>
            PDF, DOCX, LaTeX или изображение (PNG/JPG). После сдачи AI начнёт проверку.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="file">Файл работы</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.docx,.tex,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Комментарий (необязательно)</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {errMsg && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {String(errMsg)}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mut.isPending}>
            Отмена
          </Button>
          <Button
            variant="brand"
            disabled={!file || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? 'Отправка…' : 'Отправить работу'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
