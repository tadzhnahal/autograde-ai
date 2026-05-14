import { useQuery } from '@tanstack/react-query'
import { BarChart3, BookOpen, CheckCircle2, Clock, Users } from 'lucide-react'
import { teacherApi } from '@/api/endpoints'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function TeacherStatsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: teacherApi.stats,
    refetchInterval: 15_000,
  })

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Статистика</h1>
        <p className="text-sm text-slate-500">Сводка по всем вашим группам</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={BookOpen} label="Группы" value={data.groups_count} />
        <Kpi icon={Users} label="Ученики" value={data.students_count} />
        <Kpi
          icon={BarChart3}
          label="Заданий"
          value={data.assignments_count}
        />
        <Kpi
          icon={Clock}
          label="Pending"
          value={data.submissions_pending}
          accent={data.submissions_pending > 0}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          icon={CheckCircle2}
          label="AI оценено"
          value={data.submissions_ai_graded}
          subtext="требуют ревью"
          variant="brand"
        />
        <Kpi
          icon={CheckCircle2}
          label="Закрыто"
          value={data.submissions_graded}
          subtext="финальная оценка"
          variant="success"
        />
        <Kpi
          icon={BarChart3}
          label="Средний AI / Финальный"
          value={`${data.average_ai_score?.toFixed(1) ?? '—'} / ${
            data.average_final_score?.toFixed(1) ?? '—'
          }`}
        />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
          По группам
        </h2>
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Группа</th>
                <th className="px-4 py-3">Шкала</th>
                <th className="px-4 py-3">Ученики</th>
                <th className="px-4 py-3">Сабмишены</th>
                <th className="px-4 py-3">Закрыто</th>
                <th className="px-4 py-3">Средний балл</th>
              </tr>
            </thead>
            <tbody>
              {data.by_group.map((g) => (
                <tr key={g.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{g.name}</td>
                  <td className="px-4 py-3 text-slate-500">{g.grade_scale}</td>
                  <td className="px-4 py-3 text-slate-700">{g.students_count}</td>
                  <td className="px-4 py-3 text-slate-700">{g.submissions_count}</td>
                  <td className="px-4 py-3 text-slate-700">{g.graded_count}</td>
                  <td className="px-4 py-3">
                    {g.average_score != null
                      ? g.average_score.toFixed(1)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  subtext,
  accent,
  variant,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  subtext?: string
  accent?: boolean
  variant?: 'brand' | 'success'
}) {
  const valueClass =
    variant === 'brand'
      ? 'text-brand-600'
      : variant === 'success'
        ? 'text-emerald-600'
        : accent
          ? 'text-rose-600'
          : 'text-slate-900'
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
          <div className={`mt-1 text-2xl font-semibold ${valueClass}`}>{value}</div>
          {subtext && (
            <div className="mt-0.5 text-xs text-slate-500">{subtext}</div>
          )}
        </div>
        <Icon className="h-6 w-6 text-slate-300" />
      </CardContent>
    </Card>
  )
}
