export type UserRole = 'student' | 'professor'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  courseIds: string[]
  assistanceProgram?: boolean
}

export interface Course {
  id: string
  name: string
  code: string
  period: string
  professorIds: string[]
  studentIds: string[]
}

export type AttendanceStatus = 'present' | 'absent' | 'justified'

export interface ClassSession {
  id: string
  courseId: string
  startsAt: string
  endsAt: string
  topic: string
  isOpen: boolean
  code: string
}

export type ProfessorMark = 'present' | 'absent'

export interface Attendance {
  id: string
  classId: string
  studentId: string
  status: AttendanceStatus
  justification?: string
  confirmedAt: string
  /** Confirmação do professor: compareceu ou não compareceu. */
  professorMark?: ProfessorMark
}

