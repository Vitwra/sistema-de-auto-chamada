import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ShellLayout } from '../layout/ShellLayout'
import { useAuth } from '../context/AuthContext'
import { AttendanceChart } from '../components/AttendanceChart'
import {
  getFirstOpenClassForCourse,
  getStudentAttendanceSummary,
  type StudentAttendanceSummary,
} from '../services/firestoreService'
import type { ClassSession } from '../types'

export function StudentDashboardPage() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null)
  const [activeClass, setActiveClass] = useState<ClassSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!user) return
      setLoading(true)
      try {
        const [attendanceSummary, openClass] = await Promise.all([
          getStudentAttendanceSummary(user.id),
          getFirstOpenClassForCourse(user.courseIds[0] ?? 'course-1'),
        ])
        setSummary(attendanceSummary)
        setActiveClass(openClass)
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [user])

  if (!user || role !== 'student') {
    return <Navigate to="/" replace />
  }

  const total = summary?.total ?? 0
  const present = summary?.present ?? 0
  const absent = summary?.absent ?? 0
  const justified = summary?.justified ?? 0
  const effectiveTotal = total || present + absent + justified
  const presencePercent =
    effectiveTotal > 0 ? Math.round((present / effectiveTotal) * 100) : 0

  return (
    <ShellLayout
      title="Painel do aluno"
      subtitle="Acompanhe suas presenças, faltas e justificativas por disciplina."
    >
      <div className="grid gap-5 lg:grid-cols-[2fr,1.5fr]">
        <section className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Resumo geral de presença
              </h2>
              <p className="text-xs text-slate-500">
                Valores calculados a partir dos registros no Firestore.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-slate-500">Registros totais</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {effectiveTotal}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3">
                <p className="text-emerald-700">Presenças</p>
                <p className="mt-1 text-lg font-semibold text-emerald-800">
                  {present}
                </p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-3">
                <p className="text-rose-700">Faltas/justificadas</p>
                <p className="mt-1 text-lg font-semibold text-rose-800">
                  {absent + justified}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-slate-600">
                Gráfico de presença
              </p>
              <AttendanceChart
                data={{ present, absent, justified }}
                variant="pie"
                height={220}
                simplifiedLegend
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Aulas de hoje
              </h2>
              {activeClass ? (
                <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-700">
                  Chamada aberta
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                  Nenhuma chamada aberta
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {activeClass ? (
                <button
                  type="button"
                  className="flex flex-col items-start rounded-2xl border-2 border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs hover:border-brand-300 hover:bg-brand-300/30"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                    CSI606 · Programação Web I
                  </p>
                  <p className="mt-1 text-slate-800">{activeClass.topic}</p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {activeClass.startsAt} - {activeClass.endsAt}
                  </p>
                </button>
              ) : (
                <p className="text-xs text-slate-500">
                  Nenhuma aula com chamada aberta foi encontrada para as suas
                  disciplinas.
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs">
              <div>
                <p className="font-medium text-slate-800">
                  Confirmação rápida de presença
                </p>
                <p className="text-slate-500">
                  Use o código compartilhado pelo professor e confirme sua
                  presença nesta página quando a chamada estiver aberta.
                </p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => navigate('/aluno/chamada')}
                className="rounded-xl border-2 border-transparent bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:border-brand-300 hover:bg-brand-300/30 hover:text-brand-800 disabled:opacity-60"
              >
                Confirmar presença da aula atual
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <h2 className="text-sm font-semibold text-slate-900">
              Disciplinas matriculadas
            </h2>
            <ul className="mt-3 space-y-2 text-xs">
              <li className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-800">
                  CSI606 · Programação Web I
                </span>
                <span className="text-slate-500">
                  {presencePercent}% presença
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-4 text-xs text-slate-600 shadow-card">
            <h2 className="text-sm font-semibold text-slate-900">
              Avisos importantes
            </h2>
            <p className="mt-2">
              Algumas presenças podem ser registradas manualmente pelo docente ou
              coordenação em casos excepcionais. Verifique periodicamente seu
              resumo de presença.
            </p>
          </div>
        </section>
      </div>
    </ShellLayout>
  )
}

