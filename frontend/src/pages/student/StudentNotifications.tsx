import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Check } from 'lucide-react'
import { studentApi } from '@/api/endpoints'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatRelative } from '@/lib/utils'

export function StudentNotificationsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['student-notifications'],
    queryFn: () => studentApi.notifications(false),
    refetchInterval: 10_000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => studentApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-notifications'] })
      queryClient.invalidateQueries({
        queryKey: ['student-notifications', 'unread'],
      })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-slate-400" />
        <h1 className="text-2xl font-semibold text-slate-900">Уведомления</h1>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}

      {!isLoading && (data?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-slate-500">
            Уведомлений пока нет.
          </CardContent>
        </Card>
      )}

      {data?.map((n) => (
        <Card
          key={n.id}
          className={cn(
            'transition',
            !n.is_read && 'border-brand-200 bg-brand-50/40',
          )}
        >
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div>
              <div className="text-sm font-medium text-slate-900">{n.title}</div>
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
      ))}
    </div>
  )
}
