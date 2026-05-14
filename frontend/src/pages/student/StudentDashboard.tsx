import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookMarked, ChevronRight, ClipboardList } from 'lucide-react'
import { studentApi } from '@/api/endpoints'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatScore } from '@/lib/utils'

export function StudentDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: studentApi.dashboard,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Мои предметы</h1>
        <p className="text-sm text-slate-500">
          Список ваших курсов и прогресс по заданиям
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Всего заданий"
          value={data?.total_assignments ?? '—'}
          isLoading={isLoading}
          icon={ClipboardList}
        />
        <KpiCard
          label="Средний балл"
          value={
            data?.average_grade != null ? data.average_grade.toFixed(1) : '—'
          }
          isLoading={isLoading}
          icon={BookMarked}
          accent
        />
        <KpiCard
          label="Ожидают сдачи"
          value={data?.pending_submissions ?? '—'}
          isLoading={isLoading}
          icon={ClipboardList}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Курсы
        </h2>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        )}
        {!isLoading && data?.groups.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-slate-500">
              Преподаватель ещё не добавил вас в группы.
            </CardContent>
          </Card>
        )}
        {data?.groups.map((g) => (
          <Link key={g.id} to={`/student/groups/${g.id}`}>
            <Card className="transition hover:border-brand-300 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <BookMarked className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-base font-semibold text-slate-900">
                      {g.name}
                    </div>
                    <Badge variant="brand">
                      Avg{' '}
                      {g.average_score != null ? g.average_score.toFixed(1) : '—'}
                      {g.average_score != null
                        ? ` / ${maxOfScale(g.grade_scale)}`
                        : ''}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {g.assignments_completed}/{g.assignments_total} заданий
                    выполнено · шкала {g.grade_scale}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  )
}

function KpiCard({
  label,
  value,
  isLoading,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  isLoading: boolean
  icon: React.ComponentType<{ className?: string }>
  accent?: boolean
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-12" />
          ) : (
            <div
              className={
                accent
                  ? 'mt-1 text-2xl font-semibold text-brand-600'
                  : 'mt-1 text-2xl font-semibold text-slate-900'
              }
            >
              {value}
            </div>
          )}
        </div>
        <Icon className={accent ? 'h-6 w-6 text-brand-500' : 'h-6 w-6 text-slate-300'} />
      </CardContent>
    </Card>
  )
}

function maxOfScale(scale: string) {
  return scale === '0-100' ? 100 : scale === '0-5' ? 5 : 10
}
