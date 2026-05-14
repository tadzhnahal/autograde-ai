import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  ClipboardList,
  GraduationCap,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Users,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback, initialsFrom } from '@/components/ui/avatar'
import { GraderBadge } from '@/components/GraderBadge'
import { teacherApi } from '@/api/endpoints'
import { useAuth } from '@/store/auth'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

export function TeacherLayout() {
  const { user, clear } = useAuth()
  const navigate = useNavigate()

  const { data: notifications } = useQuery({
    queryKey: ['teacher-notifications', 'unread'],
    queryFn: () => teacherApi.listNotifications(true),
    refetchInterval: 10_000,
  })

  const unread = notifications?.length ?? 0

  function logout() {
    clear()
    navigate('/login', { replace: true })
  }

  const items: NavItem[] = [
    { to: '/teacher', label: 'Группы', icon: LayoutGrid },
    { to: '/teacher/students', label: 'Ученики', icon: Users },
    { to: '/teacher/assignments', label: 'Домашние задания', icon: ClipboardList },
    { to: '/teacher/stats', label: 'Статистика', icon: BarChart3 },
    { to: '/teacher/notifications', label: 'Уведомления', icon: Bell, badge: unread },
    { to: '/teacher/chat', label: 'Чат', icon: MessageSquare },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white px-3 py-5 md:flex md:flex-col md:gap-1">
          <Link to="/teacher" className="mb-4 flex items-center gap-2 px-3">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">AutoGrade AI</div>
              <div className="text-[11px] text-slate-500">Кабинет преподавателя</div>
            </div>
          </Link>

          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === '/teacher'}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )
              }
            >
              <span className="inline-flex items-center gap-2">
                <it.icon className="h-4 w-4" />
                {it.label}
              </span>
              {it.badge ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                  {it.badge}
                </span>
              ) : null}
            </NavLink>
          ))}

          <div className="mt-auto px-3 pt-4">
            <GraderBadge />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur">
            <div className="flex items-center justify-end gap-3">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback>{initialsFrom(user?.full_name ?? '?')}</AvatarFallback>
                </Avatar>
                <div className="hidden text-right text-xs sm:block">
                  <div className="font-medium text-slate-900">{user?.full_name}</div>
                  <div className="text-slate-500">{user?.email}</div>
                </div>
              </div>
              <button
                onClick={logout}
                title="Выйти"
                className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-6 py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
