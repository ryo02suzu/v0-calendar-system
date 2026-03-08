"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Session } from "@supabase/supabase-js"

export type UserRole = "admin" | "dentist" | "hygienist" | "receptionist" | "viewer"

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  staffId?: string
  clinicId: string
  name: string
}

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) {
      // Supabase未設定 → フォールバック（従来のBasic Auth互換のため）
      setIsLoading(false)
      return
    }

    // 初期セッション取得
    client.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session)
        setUser(extractUserFromSession(session))
      }
      setIsLoading(false)
    })

    // セッション変更を監視
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session ? extractUserFromSession(session) : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const client = getSupabaseClient()
    if (!client) return { error: "Supabase is not configured" }

    const { error } = await client.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }, [])

  const signOut = useCallback(async () => {
    const client = getSupabaseClient()
    if (!client) return
    await client.auth.signOut()
    setUser(null)
    setSession(null)
    // ログインページにリダイレクト
    window.location.href = "/login"
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

/**
 * Supabase セッションから AuthUser を抽出
 * user_metadata にロール情報が入っている前提
 */
function extractUserFromSession(session: Session): AuthUser {
  const { user } = session
  const metadata = user.user_metadata || {}
  return {
    id: user.id,
    email: user.email || "",
    role: (metadata.role as UserRole) || "viewer",
    staffId: metadata.staff_id,
    clinicId: metadata.clinic_id || process.env.NEXT_PUBLIC_CLINIC_ID || "",
    name: metadata.name || metadata.full_name || user.email?.split("@")[0] || "",
  }
}
