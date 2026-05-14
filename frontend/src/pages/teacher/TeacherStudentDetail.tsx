import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { teacherApi } from '@/api/endpoints'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Avatar, AvatarFallback, initialsFrom } from '@/components/ui/avatar'
import { formatDate } from '@/lib/utils'

export function TeacherStudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-student', studentId],
    queryFn: () => teacherApi.getStudent(studentId!),
    enabled: !!studentId,
  })

  const { data: submissions } = useQuery({
    queryKey: ['teacher-student-submissions', studentId],
    queryFn: () => teacherApi.listSubmissions({ student_id: studentId }),
    enabled: !!studentId,
  })

  if (isLoading) return <Skeleton className="h-32" />
  if (!data)
    return <div className="text-sm text-slate-500">Ученик не найден.</div>

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/teacher/students"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Все ученики
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback>{initialsFrom(data.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {data.full_name}
            </h1>
            <p className="text-sm text-slate-500">{data.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Сдач
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {data.submissions_count}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Оценено
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {data.graded_count}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Средний балл
            </div>
            <div className="mt-1 text-2xl font-semibold text-brand-600">
              {data.average_score != null ? data.average_score.toFixed(1) : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Группы
        </h2>
        <div className="flex flex-wrap gap-2">
          {data.groups.map((g) => (
            <Link key={g.id} to={`/teacher/groups/${g.id}`}>
              <Badge variant="brand" className="cursor-pointer hover:opacity-80">
                {g.name} ({g.grade_scale})
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          История сдач
        </h2>
        {(submissions?.length ?? 0) === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-slate-500">
              Сдач ещё не было.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Группа</th>
                  <th className="px-4 py-3">Задание</th>
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
                    <td className="px-4 py-3 text-slate-700">{s.group_name}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {s.assignment_title}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(s.submitted_at)}
                    </td>
                    <td className="px-4 py-3">
                      {s.ai_score != null ? s.ai_score.toFixed(1) : '—'}
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
                        Открыть →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  )
}
