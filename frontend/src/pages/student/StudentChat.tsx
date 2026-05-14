import { useNavigate, useParams } from 'react-router-dom'
import { ChatPage } from '@/components/Chat'

export function StudentChatPage() {
  const { groupId } = useParams<{ groupId?: string }>()
  const navigate = useNavigate()
  return (
    <ChatPage
      role="student"
      selectedGroupId={groupId}
      onGroupChange={(id) => navigate(`/student/chat/${id}`, { replace: true })}
    />
  )
}
