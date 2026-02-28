import { ReactNode, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ShellLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function ShellLayout({ children, title, subtitle }: ShellLayoutProps) {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  return (
    <div className="flex min-h-screen bg-white">
      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-brand-200 bg-white px-4 py-3 md:px-8">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="text-xs text-slate-500">{subtitle}</p>
            )}
          </div>

          <div className="relative flex items-center gap-3" ref={menuRef}>
            {user && (
              <>
                <button
                  type="button"
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-left text-xs shadow-sm hover:border-brand-300 hover:bg-brand-300/30"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <span className="font-medium text-slate-800">{user.name}</span>
                  <svg
                    className={`h-4 w-4 text-slate-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[220px] rounded-xl border-2 border-slate-200 bg-white p-3 shadow-lg">
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-600">{user.email}</p>
                    <p className="mt-1 text-[11px] capitalize text-slate-500">
                      {role === 'professor' ? 'Professor' : 'Aluno'}
                    </p>
                    <hr className="my-2 border-slate-100" />
                    <button
                      type="button"
                      onClick={async () => {
                        setShowUserMenu(false)
                        await signOut()
                        navigate('/')
                      }}
                      className="w-full rounded-lg border-2 border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </header>

        <div className="flex-1 px-4 py-6 md:px-8">{children}</div>
      </main>
    </div>
  )
}

