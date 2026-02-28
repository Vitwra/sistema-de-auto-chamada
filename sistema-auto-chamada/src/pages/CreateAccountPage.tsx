import { createUserWithEmailAndPassword } from 'firebase/auth'
import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../firebaseConfig'
import { useAuth } from '../context/AuthContext'
import { createUserWithAuthId } from '../services/firestoreService'
import type { UserRole } from '../types'

export function CreateAccountPage() {
  const navigate = useNavigate()
  const { signUpAndSetUser } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [assistanceProgram, setAssistanceProgram] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName || !trimmedEmail) {
      setError('Preencha nome e e-mail.')
      return
    }
    if (!password) {
      setError('Defina uma senha.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (role !== 'student' && role !== 'professor') {
      setError('Escolha o perfil Aluno ou Professor.')
      return
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password,
      )
      const authUserId = userCredential.user.uid

      const user = await createUserWithAuthId(
        {
          name: trimmedName,
          email: trimmedEmail,
          role,
          assistanceProgram: role === 'student' ? assistanceProgram : undefined,
        },
        authUserId,
      )
      signUpAndSetUser(user)
      if (user.role === 'student') navigate('/aluno')
      else navigate('/professor')
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : String(err)
      const code = typeof (err as { code?: string }).code === 'string' ? (err as { code: string }).code : ''
      const isAuthError = code.startsWith('auth/') || msg.includes('auth/')
      if (code === 'auth/email-already-in-use' || msg.includes('auth/email-already-in-use')) {
        setError('Este e-mail já está em uso. Use outro ou faça login.')
      } else if (code === 'auth/weak-password' || msg.includes('auth/weak-password')) {
        setError('A senha é muito fraca. Use pelo menos 6 caracteres.')
      } else if (code === 'auth/invalid-email' || msg.includes('auth/invalid-email')) {
        setError('E-mail inválido. Use um endereço de e-mail válido.')
      } else if (code === 'auth/operation-not-allowed' || msg.includes('auth/operation-not-allowed')) {
        setError('Login por e-mail/senha não está habilitado. Ative em Authentication > Sign-in method no Console do Firebase.')
      } else if (code === 'auth/configuration-not-found' || msg.includes('auth/configuration-not-found')) {
        setError('Autenticação não configurada. No Console do Firebase, ative Authentication e o método E-mail/senha e verifique o domínio autorizado.')
      } else if (code === 'auth/too-many-requests' || msg.includes('auth/too-many-requests')) {
        setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
      } else if (isAuthError) {
        const hint = code ? ` (${code})` : ''
        setError(`Não foi possível criar a conta. Tente outro e-mail ou senha com pelo menos 6 caracteres.${hint}`)
      } else {
        setError('Não foi possível salvar seu perfil. Verifique as regras do Firestore ou tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-slate-200 bg-white/80 px-8 py-8 shadow-card">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Sistema de Auto-chamada
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Criar conta
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Cadastre-se como aluno ou professor. Você será vinculado à turma de
            teste (CSI606).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@ufop.br"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Confirmar senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700">
              Perfil
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                  role === 'student'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-2 border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-300/30'
                }`}
              >
                Aluno
              </button>
              <button
                type="button"
                onClick={() => setRole('professor')}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                  role === 'professor'
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-2 border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-300/30'
                }`}
              >
                Professor
              </button>
            </div>
          </div>

          {role === 'student' && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={assistanceProgram}
                onChange={(e) => setAssistanceProgram(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Participo de programa de auxílio (permanência, transporte, etc.)
            </label>
          )}

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl border-2 border-transparent bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:border-brand-300 hover:bg-brand-300/30 hover:text-brand-800 disabled:opacity-60"
          >
            {loading ? 'Criando conta...' : 'Criar conta e entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Já tem conta?{' '}
          <Link to="/" className="font-semibold text-brand-600 hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}
