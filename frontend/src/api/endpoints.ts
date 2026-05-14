import { api } from './client'
import type {
  Assignment,
  AssignmentListItem,
  ChatGroupItem,
  ChatMessage,
  ChatThread,
  GraderHealth,
  Group,
  GroupListItem,
  Notification,
  Role,
  RubricItem,
  Student,
  StudentDashboard,
  StudentDetail,
  StudentGroupView,
  StudentInGroup,
  SubmissionDetail,
  SubmissionListItem,
  TeacherStats,
  TokenResponse,
} from '@/types/api'

// ---------- Auth ----------

export const authApi = {
  login: (email: string, password: string, role: Role) =>
    api.post<TokenResponse>('/auth/login', { email, password, role }).then((r) => r.data),
  registerTeacher: (email: string, password: string, full_name: string) =>
    api
      .post<TokenResponse>('/auth/register-teacher', { email, password, full_name })
      .then((r) => r.data),
  me: () => api.get<TokenResponse['user']>('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
}

// ---------- Health ----------

export const healthApi = {
  grader: () => api.get<GraderHealth>('/health/grader').then((r) => r.data),
}

// ---------- Teacher: groups / students / assignments ----------

export const teacherApi = {
  listGroups: () => api.get<GroupListItem[]>('/teacher/groups').then((r) => r.data),
  getGroup: (id: string) => api.get<Group>(`/teacher/groups/${id}`).then((r) => r.data),
  createGroup: (payload: { name: string; description?: string; grade_scale: string }) =>
    api.post<Group>('/teacher/groups', payload).then((r) => r.data),
  updateGroup: (
    id: string,
    payload: Partial<{ name: string; description: string; grade_scale: string }>,
  ) => api.patch<Group>(`/teacher/groups/${id}`, payload).then((r) => r.data),
  deleteGroup: (id: string) => api.delete(`/teacher/groups/${id}`).then(() => undefined),
  listGroupStudents: (id: string) =>
    api.get<StudentInGroup[]>(`/teacher/groups/${id}/students`).then((r) => r.data),

  listStudents: () => api.get<Student[]>('/teacher/students').then((r) => r.data),
  getStudent: (id: string) =>
    api.get<StudentDetail>(`/teacher/students/${id}`).then((r) => r.data),
  createStudent: (payload: {
    email: string
    password: string
    full_name: string
    group_ids: string[]
  }) => api.post<Student>('/teacher/students', payload).then((r) => r.data),

  enrollStudent: (groupId: string, studentId: string) =>
    api
      .post(`/teacher/groups/${groupId}/enroll`, { student_id: studentId })
      .then((r) => r.data),
  unenrollStudent: (groupId: string, studentId: string) =>
    api
      .delete(`/teacher/groups/${groupId}/students/${studentId}`)
      .then(() => undefined),

  listAssignments: (groupId?: string) =>
    api
      .get<AssignmentListItem[]>(
        groupId ? `/teacher/assignments?group_id=${groupId}` : '/teacher/assignments',
      )
      .then((r) => r.data),
  getAssignment: (id: string) =>
    api.get<Assignment>(`/teacher/assignments/${id}`).then((r) => r.data),
  createAssignment: (
    groupId: string,
    payload: {
      title: string
      description?: string
      due_date?: string | null
      reference_solution?: string
      rubric: RubricItem[]
    },
  ) =>
    api
      .post<Assignment>(`/teacher/groups/${groupId}/assignments`, payload)
      .then((r) => r.data),
  updateAssignment: (
    id: string,
    payload: Partial<{
      title: string
      description: string
      due_date: string | null
      reference_solution: string
      rubric: RubricItem[]
    }>,
  ) => api.patch<Assignment>(`/teacher/assignments/${id}`, payload).then((r) => r.data),
  deleteAssignment: (id: string) =>
    api.delete(`/teacher/assignments/${id}`).then(() => undefined),

  // ---------- Submissions ----------
  listSubmissions: (params?: {
    group_id?: string
    assignment_id?: string
    student_id?: string
    status_filter?: string
  }) =>
    api
      .get<SubmissionListItem[]>('/teacher/submissions', { params })
      .then((r) => r.data),
  getSubmission: (id: string) =>
    api.get<SubmissionDetail>(`/teacher/submissions/${id}`).then((r) => r.data),
  finishReview: (id: string, payload: { final_score: number; teacher_feedback: string }) =>
    api.post(`/teacher/submissions/${id}/finish`, payload).then((r) => r.data),
  requestRevision: (
    id: string,
    payload: { final_score: number; teacher_feedback: string },
  ) => api.post(`/teacher/submissions/${id}/revision`, payload).then((r) => r.data),
  regrade: (id: string) =>
    api.post(`/teacher/submissions/${id}/regrade`).then((r) => r.data),

  // ---------- Notifications + stats ----------
  listNotifications: (unread = false) =>
    api
      .get<Notification[]>('/teacher/notifications', { params: { unread_only: unread } })
      .then((r) => r.data),
  markNotificationRead: (id: string) =>
    api.post(`/teacher/notifications/${id}/read`).then((r) => r.data),
  markAllNotificationsRead: () =>
    api.post('/teacher/notifications/read-all').then((r) => r.data),
  stats: () => api.get<TeacherStats>('/teacher/stats').then((r) => r.data),
}

// ---------- Student ----------

export const studentApi = {
  dashboard: () =>
    api.get<StudentDashboard>('/student/dashboard').then((r) => r.data),
  getGroup: (id: string) =>
    api.get<StudentGroupView>(`/student/groups/${id}`).then((r) => r.data),
  submit: (assignmentId: string, file: File, notes: string) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('notes', notes)
    return api
      .post(`/student/assignments/${assignmentId}/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  notifications: (unread = false) =>
    api
      .get<Notification[]>('/student/notifications', { params: { unread_only: unread } })
      .then((r) => r.data),
  markNotificationRead: (id: string) =>
    api.post(`/student/notifications/${id}/read`).then((r) => r.data),
  mySubmission: (id: string) =>
    api.get(`/student/submissions/${id}`).then((r) => r.data),
}

// ---------- Chat ----------

export const chatApi = {
  groups: () => api.get<ChatGroupItem[]>('/chat/groups').then((r) => r.data),
  threads: (groupId: string) =>
    api.get<ChatThread[]>(`/chat/groups/${groupId}/threads`).then((r) => r.data),
  messages: (groupId: string, withUserId?: string) =>
    api
      .get<ChatMessage[]>(`/chat/groups/${groupId}/messages`, {
        params: withUserId ? { with_user_id: withUserId } : undefined,
      })
      .then((r) => r.data),
  send: (groupId: string, text: string, toUserId?: string) =>
    api
      .post<ChatMessage>(`/chat/groups/${groupId}/messages`, {
        text,
        to_user_id: toUserId,
      })
      .then((r) => r.data),
}
