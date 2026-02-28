import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ShellLayout } from '../layout/ShellLayout'
import { useAuth } from '../context/AuthContext'
import { AttendanceChart } from '../components/AttendanceChart'
import {
  createClassSessionForCourse,
  getAttendanceWithStudentsForClass,
  listClassesForCourse,
  setClassOpenState,
  type AttendanceWithStudent,
} from '../services/firestoreService'
import type { ClassSession } from '../types'

export function ProfessorDashboardPage() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const [classes, setClasses] = useState<ClassSession[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTopic, setNewTopic] = useState('')
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [attendance, setAttendance] = useState<AttendanceWithStudent[]>([])

  useEffect(() => {
    async function loadClasses() {
      if (!user) return
      setLoadingClasses(true)
      try {
        const courseId = user.courseIds[0] ?? 'course-1'
        const list = await listClassesForCourse(courseId)
        setClasses(list)
        if (!selectedClassId && list.length > 0) {
          const firstOpen = list.find((c) => c.isOpen)
          setSelectedClassId(firstOpen?.id ?? list[0].id)
        }
      } finally {
        setLoadingClasses(false)
      }
    }

    void loadClasses()
  }, [user, selectedClassId])

  useEffect(() => {
    async function loadAttendance() {
      if (!selectedClassId) {
        setAttendance([])
        return
      }
      const data = await getAttendanceWithStudentsForClass(selectedClassId)
      setAttendance(data)
    }

    void loadAttendance()
  }, [selectedClassId])

  if (!user || role !== 'professor') {
    return <Navigate to="/" replace />
  }

  const openClasses = classes.filter((c) => c.isOpen)
  const closedClasses = classes.filter((c) => !c.isOpen)
  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null

  const presentCount = attendance.filter((a) => a.status === 'present').length
  const absentCount = attendance.filter((a) => a.status === 'absent').length
  const justifiedCount = attendance.filter(
    (a) => a.status === 'justified',
  ).length
  const assistanceCount = attendance.filter(
    (a) => a.student?.assistanceProgram,
  ).length

  async function handleCreateClass() {
    if (!newTopic.trim()) return
    const courseId = user.courseIds[0] ?? 'course-1'
    try {
      setCreating(true)
      const created = await createClassSessionForCourse(courseId, newTopic)
      setClasses((prev) => [created, ...prev])
      setSelectedClassId(created.id)
      setNewTopic('')
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleOpen(classId: string, isOpen: boolean) {
    await setClassOpenState(classId, !isOpen)
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, isOpen: !isOpen } : c)),
    )
  }

  return (
    <ShellLayout
      title="Painel do professor"
      subtitle="Gerencie turmas, abra chamadas e acompanhe a participação dos estudantes."
    >
      <div className="grid gap-5 lg:grid-cols-[2fr,1.5fr]">
        <section className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Aulas em aberto
              </h2>
            </div>

            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
              <input
                type="text"
                value={newTopic}
                onChange={(event) => setNewTopic(event.target.value)}
                placeholder="Título da próxima aula"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-400"
              />
              <button
                type="button"
                onClick={handleCreateClass}
                disabled={creating}
                className="rounded-xl border-2 border-transparent bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:border-brand-300 hover:bg-brand-300/30 hover:text-brand-800 disabled:opacity-60 md:flex-shrink-0"
              >
                Criar nova aula
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {loadingClasses && (
                <p className="text-xs text-slate-500">
                  Carregando aulas...
                </p>
              )}
              {!loadingClasses && openClasses.length === 0 && closedClasses.length === 0 && (
                <p className="text-xs text-slate-500">
                  Nenhuma aula cadastrada ainda. Crie uma nova para iniciar a
                  chamada.
                </p>
              )}
              {!loadingClasses && openClasses.length === 0 && closedClasses.length > 0 && (
                <p className="text-xs text-slate-500">
                  Nenhuma aula com chamada aberta.
                </p>
              )}
              {openClasses.map((classItem) => (
                <div
                  key={classItem.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedClassId(classItem.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedClassId(classItem.id)
                    }
                  }}
                  className={`cursor-pointer rounded-2xl border p-3 text-left text-xs ${
                    selectedClassId === classItem.id
                      ? 'border-brand-400 bg-brand-50/60'
                      : 'border-2 border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-300/30'
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                    CSI606 · Programação Web I
                  </p>
                  <p className="mt-1 text-slate-800">{classItem.topic}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {classItem.startsAt} - {classItem.endsAt}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                        classItem.isOpen
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {classItem.isOpen ? 'Chamada aberta' : 'Chamada fechada'}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        void handleToggleOpen(classItem.id, classItem.isOpen)
                      }}
                      className="rounded-lg border-2 border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-300/30"
                    >
                      {classItem.isOpen ? 'Fechar chamada' : 'Abrir chamada'}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        navigate(`/professor/aulas/${classItem.id}`)
                      }}
                      className="text-[11px] font-semibold text-brand-700 hover:underline"
                    >
                      Ver presença detalhada
                    </button>
                    <span className="text-[11px] text-slate-400">
                      Código: {classItem.code}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-card">
            <h2 className="text-sm font-semibold text-slate-900">
              Controle rápido de chamada
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Visão resumida da aula selecionada, com base nos registros de
              presença salvos no banco.
            </p>

            {selectedClass ? (
              <>
                <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                  <div className="rounded-2xl bg-emerald-50 p-3">
                    <p className="text-emerald-700">Presentes</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-800">
                      {presentCount}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-3">
                    <p className="text-rose-700">Ausentes</p>
                    <p className="mt-1 text-lg font-semibold text-rose-800">
                      {absentCount}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-3">
                    <p className="text-amber-700">Justificadas</p>
                    <p className="mt-1 text-lg font-semibold text-amber-800">
                      {justifiedCount}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-slate-600">
                    Gráfico da aula selecionada
                  </p>
                  <AttendanceChart
                    data={{
                      present: presentCount,
                      absent: absentCount,
                      justified: justifiedCount,
                    }}
                    variant="bar"
                    height={200}
                  />
                </div>
              </>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                Selecione uma aula para visualizar os números de presença.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <h2 className="text-sm font-semibold text-slate-900">
              Aulas encerradas
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Chamadas já fechadas. Clique para ver o resumo ou acessar a lista de presença.
            </p>
            <ul className="mt-3 space-y-2 text-xs">
              {closedClasses.length === 0 && (
                <li className="rounded-xl bg-slate-50 px-3 py-2 text-slate-500">
                  Nenhuma aula encerrada ainda.
                </li>
              )}
              {closedClasses.map((classItem) => (
                <li
                  key={classItem.id}
                  className={`rounded-xl border-2 px-3 py-2 ${
                    selectedClassId === classItem.id
                      ? 'border-brand-400 bg-brand-50/60'
                      : 'border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-300/30'
                  }`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedClassId(classItem.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedClassId(classItem.id)
                      }
                    }}
                    className="w-full cursor-pointer text-left"
                  >
                    <p className="font-medium text-slate-800">{classItem.topic}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {classItem.startsAt} - {classItem.endsAt} · Código {classItem.code}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/professor/aulas/${classItem.id}`)
                    }}
                    className="mt-2 text-[11px] font-semibold text-brand-700 hover:underline"
                  >
                    Ver presença detalhada
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </ShellLayout>
  )
}

