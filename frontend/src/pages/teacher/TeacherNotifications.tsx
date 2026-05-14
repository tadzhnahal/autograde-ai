import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { teacherApi } from '@/api/endpoints'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatRelative } from '@/lib/utils'

const TYPE_COLOR: Record<string, string> = {
  new_submission: 'bg-sky-50 text-sky-700 border-sky-200',
  grading_done: 'bg-brand-50 text-brand-700 border-brand-200',
  grading_error: 'bg-rose-50 text-rose-700 border-rose-200',
  new_message: 'bg-amber-50 text-amber-700 border-amber-200',
}

export function TeacherNotificationsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-notifications'],
    queryFn: () => teacherApi.listNotifications(false),
    refetchInterval: 10_000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => teacherApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-notifications'] })
      queryClient.invalidateQueries({
        queryKey: ['teacher-notifications', 'unread'],
      })
    },
  })

  const markAll = useMutation({
    mutationFn: () => teacherApi.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-notifications'] })
      queryClient.invalidateQueries({
        queryKey: ['teacher-notifications', 'unread'],
      })
    },
  })

  const unreadCount = (data ?? []).filter((n) => !n.is_read).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-slate-400" />
          <h1 className="text-2xl font-semibold text-slate-900">Уведомления</h1>
          {unreadCount > 0 && (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-2 text-xs font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5" /> Прочитать все
          </Button>
        )}
      </div>

      {isLoading && <Skeleton className="h-32" />}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Уведомлений пока нет.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {data?.map((n) => {
          const linkUrl = n.link?.startsWith('/teacher/') ? n.link : undefined
          return (
            <Card
              key={n.id}
              className={cn(!n.is_read && 'border-brand-200 bg-brand-50/30')}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <span
                  className={cn(
                    'mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full border px-1.5 text-[10px] font-semibold uppercase tracking-wide',
                    TYPE_COLOR[n.type] ?? 'bg-slate-50 text-slate-600 border-slate-200',
                  )}
                >
                  {n.type.replace('_', ' ')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900">
                    {linkUrl ? (
                      <Link to={linkUrl} className="hover:underline">
                        {n.title}
                      </Link>
                    ) : (
                      n.title
                    )}
                  </div>
                  <div className="mt-0.5 text-sm text-slate-600">{n.body}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {formatRelative(n.created_at)}
                  </div>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => markRead.mutate(n.id)}
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                    title="Отметить прочитанным"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
