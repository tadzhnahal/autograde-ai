import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, Loader2, RotateCw, Sparkles } from 'lucide-react'
import { teacherApi } from '@/api/endpoints'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { SubmissionPreview } from '@/components/SubmissionPreview'
import { cn, formatDateTime } from '@/lib/utils'

export function TeacherReviewPage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: s, isLoading } = useQuery({
    queryKey: ['teacher-submission', submissionId],
    queryFn: () => teacherApi.getSubmission(submissionId!),
    enabled: !!submissionId,
    refetchInterval: (q) => {
      const status = q.state.data?.status
      return status === 'pending' || status === 'grading' ? 2500 : false
    },
  })

  const [finalScore, setFinalScore] = useState<string>('')
  const [teacherFeedback, setTeacherFeedback] = useState<string>('')

  useEffect(() => {
    if (!s) return
    if (s.final_score != null) setFinalScore(String(s.final_score))
    else if (s.ai_score != null) setFinalScore(String(s.ai_score))
    if (s.teacher_feedback) setTeacherFeedback(s.teacher_feedback)
    else if (s.ai_feedback) setTeacherFeedback(s.ai_feedback)
  }, [s?.id, s?.ai_score, s?.ai_feedback])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-submission', submissionId] })
    queryClient.invalidateQueries({ queryKey: ['teacher-groups'] })
    queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
    queryClient.invalidateQueries({ queryKey: ['teacher-all-submissions'] })
  }

  const finishMut = useMutation({
    mutationFn: () =>
      teacherApi.finishReview(submissionId!, {
        final_score: Number(finalScore),
        teacher_feedback: teacherFeedback,
      }),
    onSuccess: refresh,
  })
  const revisionMut = useMutation({
    mutationFn: () =>
      teacherApi.requestRevision(submissionId!, {
        final_score: Number(finalScore) || 0,
        teacher_feedback: teacherFeedback,
      }),
    onSuccess: refresh,
  })
  const regradeMut = useMutation({
    mutationFn: () => teacherApi.regrade(submissionId!),
    onSuccess: refresh,
  })

  if (isLoading) return <Skeleton className="h-[80vh]" />
  if (!s) return <div className="text-sm text-slate-500">Сабмишен не найден.</div>

  const lowConfidence = s.ai_confidence != null && s.ai_confidence < 0.7
  const aiInProgress = s.status === 'pending' || s.status === 'grading'

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Назад
        </button>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">
            {s.student_name}
          </h1>
          <StatusBadge status={s.status} />
        </div>
        <p className="text-sm text-slate-500">
          {s.assignment_title} · {s.group_name} · сдано{' '}
          {formatDateTime(s.submitted_at)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="flex flex-col">
          <CardContent className="flex flex-1 flex-col gap-3 p-4 min-h-[520px]">
            <SubmissionPreview
              submissionId={s.id}
              fileType={s.file_type}
              fileName={s.file_name}
            />
            {s.student_notes && (
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">
                  Комментарий ученика
                </div>
                <div className="mt-1">{s.student_notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Sparkles className="h-4 w-4 text-brand-500" />
                  AI Review
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={regradeMut.isPending || aiInProgress}
                  onClick={() => regradeMut.mutate()}
                >
                  <RotateCw className="h-3.5 w-3.5" /> Re-grade
                </Button>
              </div>

              {aiInProgress && (
                <div className="inline-flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI проверяет работу…
                </div>
              )}

              {s.status === 'error' && (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  Не удалось проверить работу автоматически. Используйте Re-grade
                  или переключитесь в mock-режим.
                </div>
              )}

              {s.ai_score != null && (
                <div
                  className={cn(
                    'rounded-lg border p-4',
                    lowConfidence
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-brand-200 bg-brand-50',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      AI Score
                    </div>
                    <Badge variant={lowConfidence ? 'warn' : 'brand'}>
                      Confidence{' '}
                      {s.ai_confidence != null
                        ? Math.round(s.ai_confidence * 100)
                        : '—'}
                      %
                    </Badge>
                  </div>
                  <div
                    className={cn(
                      'mt-1 text-3xl font-semibold',
                      lowConfidence ? 'text-amber-700' : 'text-brand-700',
                    )}
                  >
                    {s.ai_score.toFixed(1)}{' '}
                    <span className="text-base text-slate-500">
                      / {s.assignment_max_score}
                    </span>
                  </div>
                  {lowConfidence && (
                    <div className="mt-2 text-xs text-amber-800">
                      Низкая уверенность — рекомендуется ручная проверка.
                    </div>
                  )}
                </div>
              )}

              {s.ai_per_criterion && s.ai_per_criterion.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    По критериям
                  </div>
                  {s.ai_per_criterion.map((c, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-slate-100 bg-white p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-slate-800">
                          {c.criterion}
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {c.points} / {c.max_points}
                        </div>
                      </div>
                      {c.comment && (
                        <div className="mt-1 text-xs text-slate-500">{c.comment}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {s.ai_suggestions && s.ai_suggestions.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    AI Suggestions
                  </div>
                  <ul className="space-y-1">
                    {s.ai_suggestions.map((sug, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 rounded-md border border-slate-100 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {s.ai_feedback && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    AI Feedback
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{s.ai_feedback}</p>
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                Все результаты — черновик. Финальную оценку всегда ставит
                преподаватель.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="text-sm font-medium text-slate-700">
                Grade & Feedback
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="score">
                  Финальная оценка (макс {s.assignment_max_score})
                </Label>
                <Input
                  id="score"
                  type="number"
                  step="0.5"
                  min={0}
                  max={s.assignment_max_score}
                  value={finalScore}
                  onChange={(e) => setFinalScore(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="feedback">Комментарий ученику</Label>
                <Textarea
                  id="feedback"
                  rows={4}
                  value={teacherFeedback}
                  onChange={(e) => setTeacherFeedback(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="brand"
                  disabled={!finalScore || finishMut.isPending}
                  onClick={() => finishMut.mutate()}
                  className="flex-1"
                >
                  {finishMut.isPending ? 'Сохранение…' : 'Finish Review'}
                </Button>
                <Button
                  variant="outline"
                  disabled={revisionMut.isPending}
                  onClick={() => revisionMut.mutate()}
                >
                  На доработку
                </Button>
              </div>
              {finishMut.error && (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {String(
                    (finishMut.error as any)?.response?.data?.detail ??
                      finishMut.error,
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-1 p-4 text-xs text-slate-500">
              <div>
                <Link
                  to={`/teacher/students/${s.student_id}`}
                  className="text-brand-600 hover:underline"
                >
                  → Все работы {s.student_name}
                </Link>
              </div>
              <div>
                Группа:{' '}
                <Link
                  to={`/teacher/groups/${s.group_id}`}
                  className="text-brand-600 hover:underline"
                >
                  {s.group_name}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
