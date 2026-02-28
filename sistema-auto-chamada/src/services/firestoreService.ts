import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebaseConfig'
import type {
  Attendance,
  AttendanceStatus,
  ClassSession,
  User,
  UserRole,
} from '../types'

const CLASSES_COURSE_ID = 'course-1'

const classesRef = collection(db, 'classes')
const attendancesRef = collection(db, 'attendances')
const usersRef = collection(db, 'users')
const coursesRef = collection(db, 'courses')

export async function getFirstOpenClassForCourse(
  courseId: string,
): Promise<ClassSession | null> {
  const q = query(
    classesRef,
    where('courseId', '==', courseId),
    where('isOpen', '==', true),
    limit(1),
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const d = snapshot.docs[0]
  return {
    id: d.id,
    ...(d.data() as Omit<ClassSession, 'id'>),
  }
}

export interface StudentAttendanceSummary {
  total: number
  present: number
  absent: number
  justified: number
}

export async function getStudentAttendanceSummary(
  studentId: string,
): Promise<StudentAttendanceSummary> {
  const q = query(attendancesRef, where('studentId', '==', studentId))
  const snapshot = await getDocs(q)

  let present = 0
  let absent = 0
  let justified = 0

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as Attendance
    if (data.status === 'present') present += 1
    if (data.status === 'absent') absent += 1
    if (data.status === 'justified') justified += 1
  })

  const total = present + absent + justified

  return { total, present, absent, justified }
}

export async function confirmAttendance(
  classId: string,
  studentId: string,
  status: AttendanceStatus,
  justification?: string,
): Promise<void> {
  const q = query(
    attendancesRef,
    where('classId', '==', classId),
    where('studentId', '==', studentId),
  )
  const snapshot = await getDocs(q)

  const now = new Date().toISOString()

  if (snapshot.empty) {
    const newRef = doc(attendancesRef)
    const data: Record<string, string> = {
      id: newRef.id,
      classId,
      studentId,
      status,
      confirmedAt: now,
    }
    if (justification !== undefined && justification !== '') {
      data.justification = justification
    }
    await setDoc(newRef, data)
    return
  }

  const existing = snapshot.docs[0]
  const updateData: Record<string, string> = {
    status,
    confirmedAt: now,
  }
  if (justification !== undefined && justification !== '') {
    updateData.justification = justification
  }
  await updateDoc(existing.ref, updateData)
}

export async function setProfessorMark(
  attendanceId: string,
  mark: 'present' | 'absent',
): Promise<void> {
  const ref = doc(attendancesRef, attendanceId)
  const now = new Date().toISOString()
  await updateDoc(ref, {
    professorMark: mark,
    status: mark,
    confirmedAt: now,
  })
}

export async function listClassesForCourse(
  courseId: string,
): Promise<ClassSession[]> {
  const q = query(classesRef, where('courseId', '==', courseId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(
    (d) =>
      ({
        id: d.id,
        ...(d.data() as Omit<ClassSession, 'id'>),
      }) satisfies ClassSession,
  )
}

function generateAttendanceCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000)
  return String(code)
}

export async function createClassSessionForCourse(
  courseId: string,
  topic: string,
): Promise<ClassSession> {
  const now = new Date()
  const startsAt = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const ends = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const endsAt = ends.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const newRef = doc(classesRef)
  const session: ClassSession = {
    id: newRef.id,
    courseId,
    topic,
    startsAt,
    endsAt,
    isOpen: true,
    code: generateAttendanceCode(),
  }

  await setDoc(newRef, session)
  return session
}

export async function setClassOpenState(
  classId: string,
  isOpen: boolean,
): Promise<void> {
  const classDoc = doc(classesRef, classId)
  await updateDoc(classDoc, { isOpen })
}

/** Exclui uma aula e todos os registros de presença vinculados a ela. */
export async function deleteClassSession(classId: string): Promise<void> {
  const q = query(attendancesRef, where('classId', '==', classId))
  const snapshot = await getDocs(q)
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)))
  await deleteDoc(doc(classesRef, classId))
}

export async function getClassById(
  classId: string,
): Promise<ClassSession | null> {
  const classDoc = await getDoc(doc(classesRef, classId))
  if (!classDoc.exists()) return null
  return {
    id: classDoc.id,
    ...(classDoc.data() as Omit<ClassSession, 'id'>),
  }
}

export async function getAttendancesForClass(
  classId: string,
): Promise<Attendance[]> {
  const q = query(attendancesRef, where('classId', '==', classId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(
    (d) =>
      ({
        id: d.id,
        ...(d.data() as Omit<Attendance, 'id'>),
      }) satisfies Attendance,
  )
}

export interface AttendanceWithStudent extends Attendance {
  student: User | null
}

export async function getAttendanceWithStudentsForClass(
  classId: string,
): Promise<AttendanceWithStudent[]> {
  const attendances = await getAttendancesForClass(classId)
  if (attendances.length === 0) return []

  const studentIds = Array.from(
    new Set(attendances.map((a) => a.studentId)),
  ).filter(Boolean)

  const userSnaps = await Promise.all(
    studentIds.map((id) => getDoc(doc(usersRef, id))),
  )

  const usersById = new Map<string, User>()
  userSnaps.forEach((snap) => {
    if (!snap.exists()) return
    usersById.set(
      snap.id,
      {
        id: snap.id,
        ...(snap.data() as Omit<User, 'id'>),
      } satisfies User,
    )
  })

  return attendances.map((a) => ({
    ...a,
    student: usersById.get(a.studentId) ?? null,
  }))
}

export async function getUserById(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(usersRef, userId))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    id: snap.id,
    ...(data as Omit<User, 'id'>),
  }
}

export async function listStudentsWithAssistanceForCourse(
  courseId: string,
): Promise<User[]> {
  const q = query(
    usersRef,
    where('courseIds', 'array-contains', courseId),
    where('assistanceProgram', '==', true),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(
    (d) =>
      ({
        id: d.id,
        ...(d.data() as Omit<User, 'id'>),
      }) satisfies User,
  )
}

const DEFAULT_COURSE = {
  name: 'Programação Web I',
  code: 'CSI606',
  period: '2025/1',
  professorIds: [] as string[],
  studentIds: [] as string[],
}

async function ensureCourseExists(): Promise<void> {
  const courseRef = doc(coursesRef, CLASSES_COURSE_ID)
  const snap = await getDoc(courseRef)
  if (!snap.exists()) {
    await setDoc(courseRef, DEFAULT_COURSE)
  }
}

export interface CreateUserInput {
  name: string
  email: string
  role: UserRole
  assistanceProgram?: boolean
}

export async function createUser(input: CreateUserInput): Promise<User> {
  await ensureCourseExists()

  const userRef = doc(usersRef)
  const userId = userRef.id
  const user: User = {
    id: userId,
    name: input.name.trim(),
    email: input.email.trim(),
    role: input.role,
    courseIds: [CLASSES_COURSE_ID],
    assistanceProgram: input.role === 'student' ? input.assistanceProgram ?? false : undefined,
  }

  await setDoc(userRef, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    courseIds: user.courseIds,
    ...(user.assistanceProgram !== undefined && { assistanceProgram: user.assistanceProgram }),
  })

  const courseRef = doc(coursesRef, CLASSES_COURSE_ID)
  if (input.role === 'student') {
    await updateDoc(courseRef, { studentIds: arrayUnion(userId) })
  } else if (input.role === 'professor') {
    await updateDoc(courseRef, { professorIds: arrayUnion(userId) })
  }

  return user
}

/** Cria usuário no Firestore com id = authUserId (usado após criar conta com Firebase Auth). */
export async function createUserWithAuthId(
  input: CreateUserInput,
  authUserId: string,
): Promise<User> {
  await ensureCourseExists()

  const user: User = {
    id: authUserId,
    name: input.name.trim(),
    email: input.email.trim(),
    role: input.role,
    courseIds: [CLASSES_COURSE_ID],
    assistanceProgram: input.role === 'student' ? input.assistanceProgram ?? false : undefined,
  }

  const userRef = doc(usersRef, authUserId)
  await setDoc(userRef, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    courseIds: user.courseIds,
    ...(user.assistanceProgram !== undefined && { assistanceProgram: user.assistanceProgram }),
  })

  const courseRef = doc(coursesRef, CLASSES_COURSE_ID)
  if (input.role === 'student') {
    await updateDoc(courseRef, { studentIds: arrayUnion(authUserId) })
  } else if (input.role === 'professor') {
    await updateDoc(courseRef, { professorIds: arrayUnion(authUserId) })
  }

  return user
}


