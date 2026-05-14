import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { teacherApi } from '@/api/endpoints'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'

export function TeacherAssignmentsPage() {
  const [groupFilter, setGroupFilter] = useState<string>('')

  const { data: groups } = useQuery({
    queryKey: ['teacher-groups'],
    queryFn: teacherApi.listGroups,
  })

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['teacher-assignments', groupFilter],
    queryFn: () => teacherApi.listAssignments(groupFilter || undefined),
  })

  const { data: submissions } = useQuery({
    queryKey: ['teacher-all-submissions', groupFilter],
    queryFn: () =>
      teacherApi.listSubmissions(
        groupFilter ? { group_id: groupFilter } : undefined,
      ),
    refetchInterval: 5000,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Домашние задания</h1>
          <p className="text-sm text-slate-500">Все задания и сданные работы</p>
        </div>
        <div className="w-64 space-y-1.5">
          <label className="text-xs uppercase tracking-wide text-slate-500">
            Группа
          </label>
          <Select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="">Все группы</option>
            {(groups ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">
            Сабмишены ({submissions?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="assignments">
            Задания ({assignments?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          {isLoading && <Skeleton className="h-32" />}
          {!isLoading && (submissions?.length ?? 0) === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-slate-500">
                Пока нет сданных работ.
              </CardContent>
            </Card>
          )}
          {(submissions?.length ?? 0) > 0 && (
            <Card>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Ученик</th>
                    <th className="px-4 py-3">Задание / группа</th>
                    <th className="px-4 py-3">Сдано</th>
                    <th className="px-4 py-3">AI</th>
                    <th className="px-4 py-3">Итог</th>
                    <th className="px-4 py-3">Статус</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {submissions!.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {s.student_name}
                        </div>
                        <div className="text-xs text-slate-500">{s.student_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900">{s.assignment_title}</div>
                        <div className="text-xs text-slate-500">{s.group_name}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(s.submitted_at)}
                      </td>
                      <td className="px-4 py-3">
                        {s.ai_score != null ? (
                          <span className="font-medium text-brand-600">
                            {s.ai_score.toFixed(1)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
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
                          Review →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assignments">
          {isLoading && <Skeleton className="h-32" />}
          {!isLoading && (assignments?.length ?? 0) === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-slate-500">
                Заданий пока нет.
              </CardContent>
            </Card>
          )}
          <div className="space-y-2">
            {assignments?.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-base font-semibold text-slate-900">
                        {a.title}
                      </div>
                      <Badge>{a.group_name}</Badge>
                    </div>
                    {a.description && (
                      <div className="line-clamp-1 text-sm text-slate-500">
                        {a.description}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-slate-500">
                      До {formatDate(a.due_date)} · max {a.max_score}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
