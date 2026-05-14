import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, BookOpen, LogOut, MessageSquare } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback, initialsFrom } from '@/components/ui/avatar'
import { GraderBadge } from '@/components/GraderBadge'
import { studentApi } from '@/api/endpoints'
import { useAuth } from '@/store/auth'
import { cn } from '@/lib/utils'

export function StudentLayout() {
  const { user, clear } = useAuth()
  const navigate = useNavigate()

  const { data: notifications } = useQuery({
    queryKey: ['student-notifications', 'unread'],
    queryFn: () => studentApi.notifications(true),
    refetchInterval: 10_000,
  })
  const unread = notifications?.length ?? 0

  function logout() {
    clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
          <Link to="/student" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-slate-900">AutoGrade AI</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm text-slate-500">
            <NavLink
              to="/student"
              end
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 transition',
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              Мои предметы
            </NavLink>
            <NavLink
              to="/student/chat"
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1 rounded-md px-3 py-1.5 transition',
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <MessageSquare className="h-3.5 w-3.5" /> Чат
            </NavLink>
            <NavLink
              to="/student/notifications"
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1 rounded-md px-3 py-1.5 transition',
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <Bell className="h-3.5 w-3.5" />
              Уведомления
              {unread > 0 && (
                <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                  {unread}
                </span>
              )}
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <GraderBadge />
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
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
