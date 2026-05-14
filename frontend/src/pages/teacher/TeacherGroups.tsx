import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LayoutGrid, Plus } from 'lucide-react'
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
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import type { GradeScale } from '@/types/api'

export function TeacherGroupsPage() {
  const [creating, setCreating] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-groups'],
    queryFn: teacherApi.listGroups,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Группы</h1>
          <p className="text-sm text-slate-500">Ваши классы и потоки</p>
        </div>
        <Button variant="brand" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Создать группу
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {!isLoading && (data?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            У вас пока нет групп. Создайте первую — добавьте имя и шкалу оценивания.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((g) => (
          <Link key={g.id} to={`/teacher/groups/${g.id}`}>
            <Card className="h-full transition hover:border-brand-300 hover:shadow-md">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                  <Badge>Шкала {g.grade_scale}</Badge>
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-900">
                    {g.name}
                  </div>
                  {g.description && (
                    <div className="line-clamp-2 text-sm text-slate-500">
                      {g.description}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <Stat label="Ученики" value={g.students_count} />
                  <Stat label="Задания" value={g.assignments_count} />
                  <Stat
                    label="Pending"
                    value={g.pending_submissions}
                    accent={g.pending_submissions > 0}
                  />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {creating && (
        <CreateGroupDialog
          onClose={() => setCreating(false)}
          onDone={() => {
            setCreating(false)
            queryClient.invalidateQueries({ queryKey: ['teacher-groups'] })
          }}
        />
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div className="rounded-md bg-slate-50 px-2 py-1.5">
      <div
        className={
          accent
            ? 'text-sm font-semibold text-rose-600'
            : 'text-sm font-semibold text-slate-900'
        }
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  )
}

function CreateGroupDialog({
  onClose,
  onDone,
}: {
  onClose: () => void
  onDone: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scale, setScale] = useState<GradeScale>('0-10')

  const mut = useMutation({
    mutationFn: () =>
      teacherApi.createGroup({ name, description, grade_scale: scale }),
    onSuccess: () => onDone(),
  })

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая группа</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Calculus, поток 2026"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Описание</Label>
            <Textarea
              id="desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание курса"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scale">Шкала оценивания</Label>
            <Select
              id="scale"
              value={scale}
              onChange={(e) => setScale(e.target.value as GradeScale)}
            >
              <option value="0-5">0 — 5</option>
              <option value="0-10">0 — 10</option>
              <option value="0-100">0 — 100</option>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mut.isPending}>
            Отмена
          </Button>
          <Button
            variant="brand"
            disabled={!name.trim() || mut.isPending}
            onClick={() => mut.mutate()}
          >
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
