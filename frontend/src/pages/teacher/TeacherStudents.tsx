import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { teacherApi } from '@/api/endpoints'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, initialsFrom } from '@/components/ui/avatar'
import { formatDate } from '@/lib/utils'

export function TeacherStudentsPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: teacherApi.listStudents,
  })

  const filtered = (data ?? []).filter((s) =>
    `${s.full_name} ${s.email}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Ученики</h1>
        <p className="text-sm text-slate-500">Все ученики из ваших групп</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Найти по имени или email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Учеников пока нет.
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Ученик</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Создан</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{initialsFrom(s.full_name)}</AvatarFallback>
                      </Avatar>
                      <Link
                        to={`/teacher/students/${s.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {s.full_name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{s.email}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(s.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/teacher/students/${s.id}`}
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
    </div>
  )
}
