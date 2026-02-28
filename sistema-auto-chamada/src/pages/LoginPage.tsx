import { FormEvent, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoUfop from '../assets/logos/logo-ufop.svg'
import logoIcea from '../assets/logos/icea-logo.svg'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, signIn, authLoading } = useAuth()

  useEffect(() => {
    if (!user || !role || location.pathname !== '/') return
    if (role === 'student') navigate('/aluno', { replace: true })
    else if (role === 'professor') navigate('/professor', { replace: true })
  }, [user, role, location.pathname, navigate])

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Preencha e-mail e senha.')
      return
    }
    setLoading(true)
    try {
      await signIn(trimmedEmail, password)
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : String(err)
      const code = typeof (err as { code?: string }).code === 'string' ? (err as { code: string }).code : ''
      if (code === 'auth/configuration-not-found' || msg.includes('auth/configuration-not-found')) {
        setError('Autenticação não configurada. No Console do Firebase, ative Authentication e o método E-mail/senha.')
      } else if (msg.includes('auth/')) {
        setError('E-mail ou senha incorretos.')
      } else {
        setError(msg || 'E-mail ou senha incorretos.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="flex h-20 items-center overflow-visible border-b border-slate-200 bg-white px-4 md:px-6">
          <div className="flex items-center gap-4">
            <img src={logoUfop} alt="UFOP" className="h-full max-h-16 w-auto object-contain" />
            <img src={logoIcea} alt="ICEA" className="h-24 w-auto object-contain" />
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-slate-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-20 items-center overflow-visible border-b border-slate-200 bg-white px-4 md:px-6">
        <div className="flex items-center gap-4">
          <img src={logoUfop} alt="Universidade Federal de Ouro Preto" className="h-full max-h-16 w-auto object-contain" />
          <img src={logoIcea} alt="ICEA - Instituto de Ciências Exatas e Aplicadas" className="h-24 w-auto object-contain" />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 pt-4 pb-12">
        <div className="glass-panel w-full max-w-4xl rounded-2xl border-2 border-slate-200 bg-white/90 px-10 py-16 shadow-card">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex-1 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                Sistema de Auto-chamada
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                Controle de presença integrado ao MoodleUFOP
              </h1>
              <p className="text-xs text-slate-600">
                Entre com seu e-mail e senha para acessar o painel de aluno ou professor.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Aluno confirma presença em poucos toques
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  Professor acompanha faltas e presenças em tempo real
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Relatórios para programas de auxílio estudantil
                </li>
              </ul>
            </div>

            <div className="flex-1 space-y-3">
              <form
                onSubmit={handleLogin}
                className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-4"
              >
                <h2 className="text-sm font-semibold text-slate-800">Entrar</h2>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@ufop.br"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                {error && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-xl border-2 border-transparent bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:border-brand-300 hover:bg-brand-300/30 hover:text-brand-800 disabled:opacity-60"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
              <p className="text-center text-xs text-slate-500">
                <Link to="/criar-conta" className="font-semibold text-brand-600 hover:underline">
                  Criar uma conta
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
