import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { auth } from '../firebaseConfig'
import { getUserById } from '../services/firestoreService'
import type { User, UserRole } from '../types'

interface AuthContextValue {
  user: User | null
  role: UserRole | null
  authLoading: boolean
  signIn(email: string, password: string): Promise<void>
  signUpAndSetUser(user: User): void
  signInAsDemo(user: User, role: UserRole): void
  signOut(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setRole(null)
        setAuthLoading(false)
        return
      }
      try {
        const appUser = await getUserById(firebaseUser.uid)
        if (appUser) {
          setUser(appUser)
          setRole(appUser.role)
        } else {
          setUser(null)
          setRole(null)
        }
      } catch {
        setUser(null)
        setRole(null)
      } finally {
        setAuthLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  const value = useMemo(
    () => ({
      user,
      role,
      authLoading,
      async signIn(email: string, password: string) {
        await signInWithEmailAndPassword(auth, email, password)
      },
      signUpAndSetUser(nextUser: User) {
        setUser(nextUser)
        setRole(nextUser.role)
      },
      signInAsDemo(nextUser: User, nextRole: UserRole) {
        setUser(nextUser)
        setRole(nextRole)
      },
      async signOut() {
        await firebaseSignOut(auth)
        setUser(null)
        setRole(null)
      },
    }),
    [user, role, authLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
