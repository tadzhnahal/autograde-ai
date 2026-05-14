import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Sparkles } from 'lucide-react'
import { authApi } from '@/api/endpoints'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/store/auth'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/api'

type Mode = 'login' | 'register'

export function SignInPage() {
  const navigate = useNavigate()
  const setAuth = useAuth((s) => s.setAuth)

  const [role, setRole] = useState<Role>('student')
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data =
        mode === 'register'
          ? await authApi.registerTeacher(email, password, fullName)
          : await authApi.login(email, password, role)
      setAuth(data.token, data.user)
      navigate(data.user.role === 'teacher' ? '/teacher' : '/student', {
        replace: true,
      })
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ?? err?.message ?? 'Не удалось войти'
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-50 to-brand-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome to AutoGrade AI
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Загружай домашние работы и получай результаты проверки
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setRole('student')
                  setMode('login')
                }}
                className={cn(
                  'rounded-md py-1.5 text-sm font-medium transition',
                  role === 'student'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                Ученик
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={cn(
                  'rounded-md py-1.5 text-sm font-medium inline-flex items-center justify-center gap-1.5 transition',
                  role === 'teacher'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                Преподаватель
              </button>
            </div>
            {role === 'teacher' && (
              <div className="mt-3 flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={cn(
                    'rounded-md px-2 py-1 transition',
                    mode === 'login'
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  Вход
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={cn(
                    'rounded-md px-2 py-1 transition',
                    mode === 'register'
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  Регистрация
                </button>
              </div>
            )}
            <CardTitle className="mt-2">
              {mode === 'register' ? 'Регистрация преподавателя' : 'Вход в систему'}
            </CardTitle>
            <CardDescription>
              {mode === 'register'
                ? 'Создайте аккаунт преподавателя для управления группами'
                : role === 'teacher'
                  ? 'Войдите как преподаватель'
                  : 'Войдите как ученик — учётку создаёт преподаватель'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="full_name">ФИО</Label>
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={4}
                />
              </div>

              {error && (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="brand"
                size="lg"
                disabled={loading}
                className="w-full"
              >
                {loading
                  ? '...'
                  : mode === 'register'
                    ? 'Создать аккаунт'
                    : `Войти как ${role === 'teacher' ? 'преподаватель' : 'ученик'}`}
              </Button>

              {mode === 'login' && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  Demo: войти как{' '}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      setEmail('prof.ktitanov@email.com')
                      setPassword('demo1234')
                      setRole('teacher')
                    }}
                  >
                    Prof. Titanov
                  </button>{' '}
                  ·{' '}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      setEmail('elena.morozova@email.com')
                      setPassword('demo1234')
                      setRole('student')
                    }}
                  >
                    Elena Morozova
                  </button>
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-400">
          <Link to="/login">AutoGrade AI · локальная демо-сборка</Link>
        </p>
      </div>
    </div>
  )
}
