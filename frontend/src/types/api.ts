export type Role = 'teacher' | 'student'
export type GradeScale = '0-5' | '0-10' | '0-100'

export interface User {
  id: string
  email: string
  full_name: string
  role: Role
}

export interface TokenResponse {
  token: string
  user: User
}

export interface Group {
  id: string
  name: string
  description: string
  teacher_id: string
  grade_scale: GradeScale
  created_at: string
}

export interface GroupListItem extends Group {
  students_count: number
  assignments_count: number
  pending_submissions: number
}

export interface StudentInGroup {
  id: string
  email: string
  full_name: string
  enrolled_at: string
  average_score: number | null
  submissions_count: number
}

export interface Student {
  id: string
  email: string
  full_name: string
  role: Role
  created_at: string
}

export interface StudentDetail extends Student {
  groups: { id: string; name: string; grade_scale: GradeScale }[]
  submissions_count: number
  graded_count: number
  average_score: number | null
}

export interface RubricItem {
  criterion: string
  max_points: number
  description: string
}

export interface Assignment {
  id: string
  group_id: string
  title: string
  description: string
  due_date: string | null
  reference_solution: string
  rubric: RubricItem[]
  max_score: number
  created_at: string
}

export interface AssignmentListItem {
  id: string
  group_id: string
  group_name: string
  title: string
  description: string
  due_date: string | null
  max_score: number
  created_at: string
  submissions_count: number
  pending_count: number
  graded_count: number
}

export type SubmissionStatus =
  | 'pending'
  | 'grading'
  | 'ai_graded'
  | 'graded'
  | 'revision'
  | 'error'

export interface SubmissionListItem {
  id: string
  assignment_id: string
  assignment_title: string
  group_id: string
  group_name: string
  student_id: string
  student_name: string
  student_email: string
  file_type: string
  status: SubmissionStatus
  ai_score: number | null
  final_score: number | null
  submitted_at: string
  ai_graded_at: string | null
  graded_at: string | null
}

export interface CriterionScore {
  criterion: string
  points: number
  max_points: number
  comment: string
}

export interface SubmissionDetail {
  id: string
  assignment_id: string
  assignment_title: string
  assignment_description: string
  assignment_rubric: RubricItem[]
  assignment_max_score: number
  assignment_reference_solution?: string
  group_id: string
  group_name: string
  group_grade_scale: GradeScale
  student_id: string
  student_name: string
  student_email: string
  file_path: string
  file_type: string
  file_name: string
  file_url: string
  student_notes: string
  status: SubmissionStatus
  ai_score: number | null
  ai_feedback: string | null
  ai_suggestions: string[] | null
  ai_confidence: number | null
  ai_per_criterion: CriterionScore[] | null
  final_score: number | null
  teacher_feedback: string | null
  submitted_at: string
  ai_graded_at: string | null
  graded_at: string | null
}

export interface StudentDashboard {
  total_assignments: number
  pending_submissions: number
  average_grade: number | null
  groups: {
    id: string
    name: string
    grade_scale: GradeScale
    assignments_total: number
    assignments_completed: number
    average_score: number | null
  }[]
}

export interface StudentGroupView {
  id: string
  name: string
  description: string
  grade_scale: GradeScale
  teacher: { id: string; full_name: string; email: string } | null
  assignments: {
    id: string
    title: string
    description: string
    due_date: string | null
    max_score: number
    submission: null | {
      id: string
      status: SubmissionStatus
      file_name: string
      submitted_at: string
      final_score: number | null
      teacher_feedback: string | null
    }
  }[]
}

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  is_read: boolean
  created_at: string
}

export interface TeacherStats {
  groups_count: number
  students_count: number
  assignments_count: number
  submissions_total: number
  submissions_pending: number
  submissions_ai_graded: number
  submissions_graded: number
  submissions_error: number
  average_final_score: number | null
  average_ai_score: number | null
  by_group: {
    id: string
    name: string
    grade_scale: GradeScale
    students_count: number
    submissions_count: number
    graded_count: number
    average_score: number | null
  }[]
}

export interface GraderHealth {
  status: 'ok' | 'error'
  mode: 'claude_cli' | 'mock'
  version?: string
  error?: string
}

export interface ChatGroupItem {
  id: string
  name: string
  unread: number
  last_message: null | { text: string; created_at: string; from_me: boolean }
}

export interface ChatThread {
  user_id: string
  full_name: string
  role: Role
  unread: number
  last_message?: null | { text: string; created_at: string; from_me: boolean }
}

export interface ChatMessage {
  id: string
  text: string
  from_user_id: string
  to_user_id: string
  from_me: boolean
  created_at: string
}
