import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2, UserPlus } from 'lucide-react'
import { teacherApi } from '@/api/endpoints'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'
import type { RubricItem } from '@/types/api'

export function TeacherGroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const queryClient = useQueryClient()
  const [creatingStudent, setCreatingStudent] = useState(false)
  const [creatingAssignment, setCreatingAssignment] = useState(false)

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['teacher-group', groupId],
    queryFn: () => teacherApi.getGroup(groupId!),
    enabled: !!groupId,
  })
  const { data: students } = useQuery({
    queryKey: ['teacher-group-students', groupId],
    queryFn: () => teacherApi.listGroupStudents(groupId!),
    enabled: !!groupId,
  })
  const { data: assignments } = useQuery({
    queryKey: ['teacher-group-assignments', groupId],
    queryFn: () => teacherApi.listAssignments(groupId!),
    enabled: !!groupId,
  })
  const { data: submissions } = useQuery({
    queryKey: ['teacher-group-submissions', groupId],
    queryFn: () => teacherApi.listSubmissions({ group_id: groupId }),
    enabled: !!groupId,
    refetchInterval: 4000,
  })

  const unenroll = useMutation({
    mutationFn: (studentId: string) =>
      teacherApi.unenrollStudent(groupId!, studentId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['teacher-group-students', groupId],
      }),
  })

  const invalidateGroupData = () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-group-students', groupId] })
    queryClient.invalidateQueries({
      queryKey: ['teacher-group-assignments', groupId],
    })
    queryClient.invalidateQueries({ queryKey: ['teacher-groups'] })
    queryClient.invalidateQueries({ queryKey: ['teacher-stats'] })
  }

  if (groupLoading) return <Skeleton className="h-32" />
  if (!group)
    return <div className="text-sm text-slate-500">Группа не найдена.</div>

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/teacher"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Назад ко всем группам
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{group.name}</h1>
          <Badge>Шкала {group.grade_scale}</Badge>
        </div>
        {group.description && (
          <p className="mt-1 text-sm text-slate-500">{group.description}</p>
        )}
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">
            Ученики ({students?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="assignments">
            Домашние задания ({assignments?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="submissions">
            Сабмишены ({submissions?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <div className="mb-3 flex justify-end">
            <Button variant="brand" onClick={() => setCreatingStudent(true)}>
              <UserPlus className="h-4 w-4" /> Добавить ученика
            </Button>
          </div>
          {(students?.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-slate-500">
                В группе ещё нет учеников.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Ученик</th>
                    <th className="px-4 py-3">Сабмиты</th>
                    <th className="px-4 py-3">Средний балл</th>
                    <th className="px-4 py-3">Добавлен</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {students!.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/teacher/students/${s.id}`}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {s.full_name}
                        </Link>
                        <div className="text-xs text-slate-500">{s.email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {s.submissions_count}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {s.average_score != null
                          ? s.average_score.toFixed(1)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(s.enrolled_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            if (
                              confirm(`Отчислить ${s.full_name} из группы?`)
                            )
                              unenroll.mutate(s.id)
                          }}
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                          title="Отчислить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assignments">
          <div className="mb-3 flex justify-end">
            <Button variant="brand" onClick={() => setCreatingAssignment(true)}>
              <Plus className="h-4 w-4" /> Новое задание
            </Button>
          </div>
          {(assignments?.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-slate-500">
                Заданий пока нет.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {assignments!.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        {a.title}
                      </div>
                      {a.description && (
                        <div className="line-clamp-1 text-sm text-slate-500">
                          {a.description}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-slate-500">
                        До {formatDate(a.due_date)} · максимум {a.max_score}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">Pending {a.pending_count}</Badge>
                      <Badge variant="success">Graded {a.graded_count}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions">
          <SubmissionsTable submissions={submissions ?? []} />
        </TabsContent>
      </Tabs>

      {creatingStudent && (
        <CreateStudentDialog
          groupId={groupId!}
          onClose={() => setCreatingStudent(false)}
          onDone={() => {
            setCreatingStudent(false)
            invalidateGroupData()
          }}
        />
      )}

      {creatingAssignment && (
        <CreateAssignmentDialog
          groupId={groupId!}
          maxScore={Number(group.grade_scale.split('-')[1])}
          onClose={() => setCreatingAssignment(false)}
          onDone={() => {
            setCreatingAssignment(false)
            invalidateGroupData()
          }}
        />
      )}
    </div>
  )
}

function SubmissionsTable({
  submissions,
}: {
  submissions: import('@/types/api').SubmissionListItem[]
}) {
  if (submissions.length === 0)
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-500">
          Пока нет сданных работ.
        </CardContent>
      </Card>
    )
  return (
    <Card>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Ученик</th>
            <th className="px-4 py-3">Задание</th>
            <th className="px-4 py-3">Сдано</th>
            <th className="px-4 py-3">AI</th>
            <th className="px-4 py-3">Итог</th>
            <th className="px-4 py-3">Статус</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id} className="border-b border-slate-50">
              <td className="px-4 py-3 text-slate-900">{s.student_name}</td>
              <td className="px-4 py-3 text-slate-700">{s.assignment_title}</td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {formatDate(s.submitted_at)}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {s.ai_score != null ? s.ai_score.toFixed(1) : '—'}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {s.final_score != null ? s.final_score.toFixed(1) : '—'}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={s.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/teacher/submissions/${s.id}`}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Открыть →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function CreateStudentDialog({
  groupId,
  onClose,
  onDone,
}: {
  groupId: string
  onClose: () => void
  onDone: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('demo1234')

  const mut = useMutation({
    mutationFn: () =>
      teacherApi.createStudent({
        full_name: fullName,
        email,
        password,
        group_ids: [groupId],
      }),
    onSuccess: () => onDone(),
  })

  const errMsg =
    (mut.error as any)?.response?.data?.detail ?? (mut.error as any)?.message

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый ученик</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="fn">ФИО</Label>
            <Input
              id="fn"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="em">Email</Label>
            <Input
              id="em"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Временный пароль</Label>
            <Input
              id="pw"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            disabled={!fullName.trim() || !email.trim() || mut.isPending}
            onClick={() => mut.mutate()}
          >
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateAssignmentDialog({
  groupId,
  maxScore,
  onClose,
  onDone,
}: {
  groupId: string
  maxScore: number
  onClose: () => void
  onDone: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [rubric, setRubric] = useState<RubricItem[]>([
    { criterion: 'Правильность', max_points: maxScore, description: '' },
  ])

  const mut = useMutation({
    mutationFn: () =>
      teacherApi.createAssignment(groupId, {
        title,
        description,
        reference_solution: reference,
        rubric,
      }),
    onSuccess: () => onDone(),
  })

  function updateItem(idx: number, patch: Partial<RubricItem>) {
    setRubric((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Новое задание</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Название</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Описание</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Эталонное решение (текст)</Label>
            <Textarea
              rows={4}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Какой ответ ожидается и какие шаги должны быть"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Критерии (rubric)</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setRubric((arr) => [
                    ...arr,
                    { criterion: '', max_points: 1, description: '' },
                  ])
                }
              >
                <Plus className="h-3 w-3" /> Добавить критерий
              </Button>
            </div>
            {rubric.map((it, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_100px_auto] gap-2 rounded-md border border-slate-100 p-2"
              >
                <Input
                  placeholder="Название критерия"
                  value={it.criterion}
                  onChange={(e) => updateItem(idx, { criterion: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  value={it.max_points}
                  onChange={(e) =>
                    updateItem(idx, { max_points: Number(e.target.value) })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setRubric((arr) => arr.filter((_, i) => i !== idx))
                  }
                  className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="text-xs text-slate-500">
              Сумма max_points: {rubric.reduce((a, b) => a + b.max_points, 0)} ·
              max_score задания: {maxScore}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mut.isPending}>
            Отмена
          </Button>
          <Button
            variant="brand"
            disabled={!title.trim() || mut.isPending}
            onClick={() => mut.mutate()}
          >
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
