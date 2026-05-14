import { useNavigate, useParams } from 'react-router-dom'
import { ChatPage } from '@/components/Chat'

export function TeacherChatPage() {
  const { groupId } = useParams<{ groupId?: string }>()
  const navigate = useNavigate()
  return (
    <ChatPage
      role="teacher"
      selectedGroupId={groupId}
      onGroupChange={(id) => navigate(`/teacher/chat/${id}`, { replace: true })}
    />
  )
}
