import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { chatApi } from '@/api/endpoints'
import { Avatar, AvatarFallback, initialsFrom } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatRelative } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import type { Role } from '@/types/api'

interface ChatPageProps {
  role: Role
  selectedGroupId?: string
  onGroupChange: (groupId: string) => void
}

type ChatMessage = {
  id: string
  text: string
  from_user_id: string
  to_user_id: string
  from_me: boolean
  created_at: string
}

export function ChatPage({ role, selectedGroupId, onGroupChange }: ChatPageProps) {
  const [selectedThread, setSelectedThread] = useState<string | null>(null)

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['chat-groups'],
    queryFn: chatApi.groups,
    refetchInterval: 8000,
  })

  // Авто-выбор группы при первом заходе
  useEffect(() => {
    if (!selectedGroupId && groups && groups.length > 0) {
      onGroupChange(groups[0].id)
    }
  }, [groups, selectedGroupId, onGroupChange])

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-slate-900">Чат</h1>
      <div className="grid h-[calc(100vh-220px)] min-h-[440px] grid-cols-[260px_1fr] gap-3">
        <aside className="overflow-y-auto rounded-xl border border-slate-200 bg-white">
          {groupsLoading && (
            <div className="space-y-2 p-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          )}
          {!groupsLoading && (groups?.length ?? 0) === 0 && (
            <div className="p-6 text-center text-sm text-slate-500">
              Нет доступных чатов
            </div>
          )}
          {groups?.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                onGroupChange(g.id)
                setSelectedThread(null)
              }}
              className={cn(
                'flex w-full items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50',
                selectedGroupId === g.id && 'bg-slate-100',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-900">
                  {g.name}
                </div>
                {g.last_message ? (
                  <div className="truncate text-xs text-slate-500">
                    {g.last_message.from_me ? 'Вы: ' : ''}
                    {g.last_message.text}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Нет сообщений</div>
                )}
              </div>
              {g.unread > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                  {g.unread}
                </span>
              )}
            </button>
          ))}
        </aside>

        {selectedGroupId ? (
          <ChatPanel
            groupId={selectedGroupId}
            role={role}
            selectedThread={selectedThread}
            onSelectThread={setSelectedThread}
          />
        ) : (
          <Card>
            <CardContent className="grid h-full place-items-center py-16 text-sm text-slate-500">
              Выберите группу слева
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function ChatPanel({
  groupId,
  role,
  selectedThread,
  onSelectThread,
}: {
  groupId: string
  role: Role
  selectedThread: string | null
  onSelectThread: (id: string) => void
}) {
  const queryClient = useQueryClient()

  const { data: threads } = useQuery({
    queryKey: ['chat-threads', groupId],
    queryFn: () => chatApi.threads(groupId),
    refetchInterval: 8000,
  })

  // Для студента автоматом подставляем единственного учителя
  useEffect(() => {
    if (role === 'student' && threads && threads.length > 0 && !selectedThread) {
      onSelectThread(threads[0].user_id)
    }
  }, [threads, role, selectedThread, onSelectThread])

  if (role === 'teacher' && !selectedThread) {
    return (
      <Card className="overflow-y-auto">
        <CardContent className="space-y-1 p-2">
          <div className="px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
            Ученики группы
          </div>
          {(threads ?? []).map((t) => (
            <button
              key={t.user_id}
              onClick={() => onSelectThread(t.user_id)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback>{initialsFrom(t.full_name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-slate-900">
                  {t.full_name}
                </span>
              </span>
              {t.unread > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                  {t.unread}
                </span>
              )}
            </button>
          ))}
          {(threads ?? []).length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-slate-500">
              В группе нет учеников
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!selectedThread) return <Skeleton className="h-full" />

  return (
    <ChatThread
      groupId={groupId}
      withUserId={selectedThread}
      role={role}
      threadName={
        threads?.find((t) => t.user_id === selectedThread)?.full_name ?? ''
      }
      onBack={role === 'teacher' ? () => onSelectThread('') : undefined}
      onSent={() => {
        queryClient.invalidateQueries({ queryKey: ['chat-groups'] })
        queryClient.invalidateQueries({ queryKey: ['chat-threads', groupId] })
      }}
    />
  )
}

function ChatThread({
  groupId,
  withUserId,
  role,
  threadName,
  onBack,
  onSent,
}: {
  groupId: string
  withUserId: string
  role: Role
  threadName: string
  onBack?: () => void
  onSent: () => void
}) {
  const me = useAuth((s) => s.user)
  const [text, setText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data: messages } = useQuery({
    queryKey: ['chat-messages', groupId, withUserId],
    queryFn: () => chatApi.messages(groupId, role === 'teacher' ? withUserId : undefined),
    refetchInterval: 5000,
  })

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages?.length])

  const mut = useMutation({
    mutationFn: (txt: string) =>
      chatApi.send(groupId, txt, role === 'teacher' ? withUserId : undefined),
    onSuccess: (createdMessage: ChatMessage) => {
      setText('')

      queryClient.setQueryData<ChatMessage[]>(
          ['chat-messages', groupId, withUserId],
          (prev) => [...(prev ?? []), createdMessage],
      )

      queryClient.invalidateQueries({
          queryKey: ['chat-messages', groupId, withUserId],
      })

      onSent()
    },
  })

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="text-xs text-slate-500 hover:underline">
              ← К списку
            </button>
          )}
          <Avatar className="h-7 w-7">
            <AvatarFallback>{initialsFrom(threadName || '?')}</AvatarFallback>
          </Avatar>
          <div className="text-sm font-medium text-slate-900">
            {threadName || (role === 'student' ? 'Преподаватель' : 'Ученик')}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {(messages ?? []).length === 0 && (
          <div className="grid h-full place-items-center text-sm text-slate-400">
            Ещё нет сообщений. Напишите первое.
          </div>
        )}
        {messages?.map((m) => (
          <div
            key={m.id}
            className={cn('flex', m.from_me ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[70%] rounded-xl px-3 py-2 text-sm',
                m.from_me
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-900',
              )}
            >
              <div>{m.text}</div>
              <div
                className={cn(
                  'mt-1 text-[10px]',
                  m.from_me ? 'text-white/70' : 'text-slate-400',
                )}
              >
                {formatRelative(m.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) mut.mutate(text.trim())
        }}
        className="flex items-center gap-2 border-t border-slate-100 p-3"
      >
        <Input
          placeholder="Введите сообщение…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={mut.isPending}
        />
        <Button
          type="submit"
          variant="brand"
          size="icon"
          disabled={!text.trim() || mut.isPending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
      {/* me для возможного использования в будущем */}
      {!me && null}
    </Card>
  )
}
