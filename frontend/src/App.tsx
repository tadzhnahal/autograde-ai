import { useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { setUnauthorizedHandler } from '@/api/client'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { StudentLayout } from '@/components/layout/StudentLayout'
import { TeacherLayout } from '@/components/layout/TeacherLayout'
import { SignInPage } from '@/pages/SignIn'
import { StudentDashboardPage } from '@/pages/student/StudentDashboard'
import { StudentGroupPage } from '@/pages/student/StudentGroupPage'
import { StudentChatPage } from '@/pages/student/StudentChat'
import { StudentNotificationsPage } from '@/pages/student/StudentNotifications'
import { TeacherGroupsPage } from '@/pages/teacher/TeacherGroups'
import { TeacherGroupDetailPage } from '@/pages/teacher/TeacherGroupDetail'
import { TeacherStudentsPage } from '@/pages/teacher/TeacherStudents'
import { TeacherStudentDetailPage } from '@/pages/teacher/TeacherStudentDetail'
import { TeacherAssignmentsPage } from '@/pages/teacher/TeacherAssignments'
import { TeacherReviewPage } from '@/pages/teacher/TeacherReview'
import { TeacherStatsPage } from '@/pages/teacher/TeacherStats'
import { TeacherNotificationsPage } from '@/pages/teacher/TeacherNotifications'
import { TeacherChatPage } from '@/pages/teacher/TeacherChat'
import { useAuth } from '@/store/auth'

export default function App() {
  const navigate = useNavigate()
  const { clear, user } = useAuth()

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clear()
      navigate('/login', { replace: true })
    })
  }, [clear, navigate])

  return (
    <Routes>
      <Route path="/login" element={<SignInPage />} />

      <Route element={<ProtectedRoute role="student" />}>
        <Route element={<StudentLayout />}>
          <Route path="/student" element={<StudentDashboardPage />} />
          <Route path="/student/groups/:groupId" element={<StudentGroupPage />} />
          <Route path="/student/chat" element={<StudentChatPage />} />
          <Route path="/student/chat/:groupId" element={<StudentChatPage />} />
          <Route
            path="/student/notifications"
            element={<StudentNotificationsPage />}
          />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="teacher" />}>
        <Route element={<TeacherLayout />}>
          <Route path="/teacher" element={<TeacherGroupsPage />} />
          <Route path="/teacher/groups/:groupId" element={<TeacherGroupDetailPage />} />
          <Route path="/teacher/students" element={<TeacherStudentsPage />} />
          <Route
            path="/teacher/students/:studentId"
            element={<TeacherStudentDetailPage />}
          />
          <Route path="/teacher/assignments" element={<TeacherAssignmentsPage />} />
          <Route
            path="/teacher/submissions/:submissionId"
            element={<TeacherReviewPage />}
          />
          <Route path="/teacher/stats" element={<TeacherStatsPage />} />
          <Route
            path="/teacher/notifications"
            element={<TeacherNotificationsPage />}
          />
          <Route path="/teacher/chat" element={<TeacherChatPage />} />
          <Route path="/teacher/chat/:groupId" element={<TeacherChatPage />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to={user ? (user.role === 'teacher' ? '/teacher' : '/student') : '/login'}
            replace
          />
        }
      />
    </Routes>
  )
}
