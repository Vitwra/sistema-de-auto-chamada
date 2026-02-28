import { FormEvent, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ShellLayout } from '../layout/ShellLayout'
import { useAuth } from '../context/AuthContext'
import {
  confirmAttendance,
  getFirstOpenClassForCourse,
} from '../services/firestoreService'
import type { ClassSession } from '../types'

export function StudentAttendancePage() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const [activeClass, setActiveClass] = useState<ClassSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [justification, setJustification] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [justificationSent, setJustificationSent] = useState(false)

  useEffect(() => {
    async function loadOpenClass() {
      if (!user) return
      try {
        setLoading(true)
        setError(null)
        const courseId = user.courseIds[0] ?? 'course-1'
        const openClass = await getFirstOpenClassForCourse(courseId)
        setActiveClass(openClass)
      } catch (err) {
        console.error(err)
        setError('Não foi possível carregar a aula atual.')
      } finally {
        setLoading(false)
      }
    }

    void loadOpenClass()
  }, [user])

  if (!user || role !== 'student') {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    status: 'present' | 'absent' | 'justified',
  ) {
    event.preventDefault()
    if (!activeClass) return

    try {
      setSubmitting(true)
      setFeedback(null)
      await confirmAttendance(
        activeClass.id,
        user.id,
        status,
        status === 'absent' || status === 'justified' ? justification : undefined,
      )
      if (status === 'absent' || status === 'justified') {
        setJustificationSent(true)
        setJustification('')
        setFeedback(null)
      } else {
        setFeedback('Presença confirmada')
      }
    } catch (err) {
      console.error(err)
      const message =
        err instanceof Error ? err.message : 'Ocorreu um erro ao registrar sua presença.'
      const isPermissionDenied =
        typeof message === 'string' &&
        (message.includes('permission') || message.includes('Permission') || message.includes('permissão'))
      setFeedback(
        isPermissionDenied
          ? 'Permissão negada no Firestore. Configure as regras do banco para permitir escrita na coleção "attendances".'
          : message,
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ShellLayout
      title="Confirmação de presença"
      subtitle="Utilize esta tela para registrar sua presença ou ausência na aula atual."
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate('/aluno')}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:border-brand-300 hover:bg-brand-300/30"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao painel
          </button>
        </div>

        {feedback && (
          <div
            className={`rounded-2xl border-2 px-4 py-3 text-center text-sm font-semibold ${
              feedback === 'Presença confirmada'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {feedback}
          </div>
        )}

        <section className="rounded-2xl bg-white p-4 shadow-card">
          {loading && (
            <p className="text-xs text-slate-600">
              Carregando informações da aula...
            </p>
          )}
          {!loading && error && (
            <p className="text-xs text-rose-600">{error}</p>
          )}
          {!loading && !error && !activeClass && (
            <p className="text-xs text-slate-600">
              Nenhuma chamada aberta encontrada para suas disciplinas no momento.
            </p>
          )}

          {activeClass && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                    Aula atual
                  </p>
                  <p className="text-slate-800">{activeClass.topic}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {activeClass.startsAt} - {activeClass.endsAt}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">
                  <p className="text-[11px] text-slate-500">Código da chamada</p>
                  <p className="text-base font-semibold tracking-[0.25em] text-slate-900">
                    {activeClass.code}
                  </p>
                </div>
              </div>

          <form
            onSubmit={(event) => handleSubmit(event, 'present')}
            className="mt-4 space-y-3 rounded-2xl bg-slate-50 px-4 py-3"
          >
            <p className="text-xs font-medium text-slate-800">
              Estou presente nesta aula
            </p>
            <p className="text-[11px] text-slate-500">
              Ao confirmar sua presença, o registro será salvo diretamente no
              banco de dados de frequência para esta disciplina.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl border-2 border-transparent bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:border-brand-300 hover:bg-brand-300/30 hover:text-brand-800 disabled:opacity-60"
            >
              Confirmar presença
            </button>
          </form>

          {justificationSent ? (
            <div className="mt-4 rounded-2xl border-2 border-brand-300 bg-brand-600/30 px-4 py-3 text-center text-sm font-semibold text-brand-800">
              Justificativa enviada.
            </div>
          ) : (
            <form
              onSubmit={(event) => handleSubmit(event, 'absent')}
              className="mt-4 space-y-3 rounded-2xl border-2 border-brand-300 bg-brand-600/30 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-brand-800">
                  Registrar ausência ou justificativa
                </p>
                <span className="text-[11px] text-brand-700">
                  Informação encaminhada ao docente
                </span>
              </div>
              <textarea
                value={justification}
                onChange={(event) => setJustification(event.target.value)}
                rows={3}
                className="w-full rounded-xl border-2 border-brand-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                placeholder="Descreva o motivo da ausência (por exemplo, atestado médico, problema de transporte, etc.)."
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl border-2 border-transparent bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:border-brand-300 hover:bg-brand-300/30 hover:text-brand-800 disabled:opacity-60"
                >
                  Enviar ausência/justificativa
                </button>
                <p className="text-[11px] text-brand-700">
                  A confirmação será registrada também para uso em relatórios.
                </p>
              </div>
            </form>
          )}
              </div>
          )}
        </section>
      </div>
    </ShellLayout>
  )
}

