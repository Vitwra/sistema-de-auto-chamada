import { useEffect, useState } from 'react'
import { Navigate, useParams, useNavigate } from 'react-router-dom'
import { ShellLayout } from '../layout/ShellLayout'
import { useAuth } from '../context/AuthContext'
import { AttendanceChart } from '../components/AttendanceChart'
import {
  deleteClassSession,
  getAttendanceWithStudentsForClass,
  getClassById,
  setProfessorMark,
  type AttendanceWithStudent,
} from '../services/firestoreService'
import type { ClassSession } from '../types'

export function ProfessorClassDetailPage() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [classInfo, setClassInfo] = useState<ClassSession | null>(null)
  const [attendance, setAttendance] = useState<AttendanceWithStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [updatingMark, setUpdatingMark] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!id) return
      setLoading(true)
      try {
        const [cls, att] = await Promise.all([
          getClassById(id),
          getAttendanceWithStudentsForClass(id),
        ])
        setClassInfo(cls)
        setAttendance(att)
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [id])

  if (!user || role !== 'professor') {
    return <Navigate to="/" replace />
  }

  const present = attendance.filter((a) => a.status === 'present')
  const absent = attendance.filter((a) => a.status === 'absent')
  const justified = attendance.filter((a) => a.status === 'justified')
  const assistance = attendance.filter((a) => a.student?.assistanceProgram)

  async function handleProfessorMark(attendanceId: string, mark: 'present' | 'absent') {
    setUpdatingMark(attendanceId)
    try {
      await setProfessorMark(attendanceId, mark)
      setAttendance((prev) =>
        prev.map((a) =>
          a.id === attendanceId
            ? { ...a, professorMark: mark, status: mark }
            : a,
        ),
      )
    } catch (err) {
      console.error(err)
      window.alert('Não foi possível atualizar a confirmação. Tente novamente.')
    } finally {
      setUpdatingMark(null)
    }
  }

  async function handleDeleteClass() {
    if (!id) return
    if (!window.confirm('Excluir esta aula? Os registros de presença vinculados também serão removidos. Esta ação não pode ser desfeita.')) return
    setDeleting(true)
    try {
      await deleteClassSession(id)
      navigate('/professor')
    } catch (err) {
      console.error(err)
      window.alert('Não foi possível excluir a aula. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <ShellLayout
      title="Presença por aula"
      subtitle="Detalhamento da chamada, com foco em alunos presentes, ausentes e em programas de auxílio."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/professor')}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:border-brand-300 hover:bg-brand-300/30"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao painel
        </button>
        {classInfo && (
          <button
            type="button"
            onClick={handleDeleteClass}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 shadow-sm hover:border-rose-300 hover:bg-rose-100 disabled:opacity-60"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {deleting ? 'Excluindo...' : 'Excluir aula'}
          </button>
        )}
      </div>
      <div className="grid gap-5 lg:grid-cols-[2fr,1.5fr]">
        <section className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-card text-xs">
            {loading && (
              <p className="text-slate-500">
                Carregando informações de presença...
              </p>
            )}
            {!loading && !classInfo && (
              <p className="text-slate-500">
                Aula não encontrada. Verifique se o link está correto.
              </p>
            )}
            {classInfo && (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                      CSI606 · Programação Web I
                    </p>
                    <p className="text-slate-800">{classInfo.topic}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {classInfo.startsAt} - {classInfo.endsAt}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">
                    <p className="text-[11px] text-slate-500">
                      Código da chamada
                    </p>
                    <p className="text-base font-semibold tracking-[0.25em] text-slate-900">
                      {classInfo.code}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-emerald-50 p-3">
                    <p className="text-emerald-700">Presentes</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-800">
                      {present.length}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-3">
                    <p className="text-rose-700">Ausentes</p>
                    <p className="mt-1 text-lg font-semibold text-rose-800">
                      {absent.length}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-3">
                    <p className="text-amber-700">Justificadas</p>
                    <p className="mt-1 text-lg font-semibold text-amber-800">
                      {justified.length}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-slate-600">
                    Gráfico de presença desta aula
                  </p>
                  <AttendanceChart
                    data={{
                      present: present.length,
                      absent: absent.length,
                      justified: justified.length,
                    }}
                    variant="bar"
                    height={200}
                  />
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-card text-xs">
            <h2 className="text-sm font-semibold text-slate-900">
              Lista de presença
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Alunos que registraram presença, ausência ou justificativa via
              sistema de auto-chamada.
            </p>
            <ul className="mt-3 divide-y divide-slate-100">
              {attendance.map((a) => (
                <li key={a.id} className="flex items-start justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {a.student?.name ?? 'Aluno desconhecido'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {a.student?.email ?? a.studentId}
                    </p>
                    {a.justification && (
                      <p className="mt-1 text-[11px] text-slate-600">
                        Justificativa: {a.justification}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      a.status === 'present'
                        ? 'bg-emerald-50 text-emerald-700'
                        : a.status === 'justified'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {a.status === 'present'
                      ? 'Presente'
                      : a.status === 'justified'
                      ? 'Falta justificada'
                      : 'Ausente'}
                  </span>
                </li>
              ))}
              {attendance.length === 0 && !loading && (
                <li className="py-2 text-[11px] text-slate-500">
                  Nenhum registro de presença para esta aula ainda.
                </li>
              )}
            </ul>

            <h2 className="mt-6 text-sm font-semibold text-slate-900">
              Confirmação do professor
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Para cada aluno, confirme se compareceu ou não à aula.
            </p>
            <ul className="mt-3 divide-y divide-slate-100">
              {attendance.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {a.student?.name ?? 'Aluno desconhecido'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {a.student?.email ?? a.studentId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.professorMark != null && (
                      <span className="text-[11px] text-slate-600">
                        {a.professorMark === 'present'
                          ? 'Confirmado: compareceu'
                          : 'Confirmado: não compareceu'}
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={updatingMark === a.id}
                      onClick={() => handleProfessorMark(a.id, 'present')}
                      className="rounded-xl border-2 border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      {updatingMark === a.id ? '...' : 'Compareceu'}
                    </button>
                    <button
                      type="button"
                      disabled={updatingMark === a.id}
                      onClick={() => handleProfessorMark(a.id, 'absent')}
                      className="rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-700 hover:border-rose-300 hover:bg-rose-100 disabled:opacity-60"
                    >
                      {updatingMark === a.id ? '...' : 'Não compareceu'}
                    </button>
                  </div>
                </li>
              ))}
              {attendance.length === 0 && !loading && (
                <li className="py-2 text-[11px] text-slate-500">
                  Não há alunos na lista para confirmar. Registros aparecem aqui
                  quando os alunos marcam presença/ausência.
                </li>
              )}
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-card text-xs">
            <h2 className="text-sm font-semibold text-slate-900">
              Alunos em programas de auxílio
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Somente alunos marcados como participantes de programas de auxílio
              institucional.
            </p>
            <ul className="mt-3 space-y-2">
              {assistance.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-xl border-2 border-brand-300 bg-brand-600/30 px-3 py-2"
                >
                  <span className="font-medium text-brand-900">
                    {a.student?.name ?? 'Aluno desconhecido'}
                  </span>
                  <span className="text-[11px] text-brand-700">
                    {a.status === 'present'
                      ? 'Presente'
                      : a.status === 'justified'
                      ? 'Falta justificada'
                      : 'Ausente'}
                  </span>
                </li>
              ))}
              {assistance.length === 0 && !loading && (
                <li className="rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                  Nenhum aluno em programa de auxílio registrou presença/ausência
                  nesta aula.
                </li>
              )}
            </ul>
          </div>
        </section>
      </div>
    </ShellLayout>
  )
}

