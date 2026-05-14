import { useQuery } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { healthApi } from '@/api/endpoints'
import { cn } from '@/lib/utils'

export function GraderBadge() {
  const { data, isLoading } = useQuery({
    queryKey: ['health-grader'],
    queryFn: healthApi.grader,
    refetchInterval: 30_000,
    retry: false,
  })

  const ok = data?.status === 'ok'
  const label = isLoading
    ? 'AI Grader: …'
    : ok
      ? `AI Grader: online${data?.mode === 'mock' ? ' (mock)' : ''}`
      : 'AI Grader: offline'

  return (
    <div
      title={data?.version ?? data?.error ?? ''}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
        ok
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-rose-200 bg-rose-50 text-rose-700',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          ok ? 'bg-emerald-500' : 'bg-rose-500',
        )}
      />
      <Sparkles className="h-3.5 w-3.5" />
      {label}
    </div>
  )
}
