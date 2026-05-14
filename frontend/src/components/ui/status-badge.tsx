import { Badge } from './badge'
import type { SubmissionStatus } from '@/types/api'

const LABELS: Record<SubmissionStatus, string> = {
  pending: 'Ожидает',
  grading: 'AI проверяет…',
  ai_graded: 'AI оценил',
  graded: 'Оценено',
  revision: 'На доработку',
  error: 'Ошибка',
}

const VARIANTS: Record<
  SubmissionStatus,
  'default' | 'brand' | 'success' | 'info' | 'warn' | 'danger'
> = {
  pending: 'default',
  grading: 'info',
  ai_graded: 'brand',
  graded: 'success',
  revision: 'warn',
  error: 'danger',
}

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>
}
