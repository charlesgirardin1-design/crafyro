// -----------------------------------------------------------------------------
// AuthProvider.jsx
// Contexte React qui expose la session Supabase (connexion par lien magique,
// sans mot de passe) à toute l'application, ainsi que quelques helpers d'appel
// API qui joignent automatiquement le jeton d'accès de l'utilisateur connecté.
// -----------------------------------------------------------------------------
'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from './supabaseClient.js'

const AuthContext = createContext(null)

// -----------------------------------------------------------------------------
// TEMPORAIRE : bypass de connexion pour prévisualiser l'app sans Supabase
// configuré. Passe à `false` (ou supprime ce bloc) une fois Supabase branché.
// -----------------------------------------------------------------------------
const GUEST_BYPASS = true
const GUEST_SESSION = GUEST_BYPASS
  ? { access_token: null, user: { id: 'guest-temp', email: 'invite@local' } }
  : null

export function AuthProvider({ children }) {
  const supabase = getSupabaseBrowserClient()
  const [session, setSession] = useState(GUEST_SESSION)
  const [loading, setLoading] = useState(!GUEST_BYPASS)

  useEffect(() => {
    if (GUEST_BYPASS) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [supabase])

  const signInWithEmail = useCallback(
    async (email) => {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
      return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
    },
    [supabase]
  )

  const signOut = useCallback(() => supabase.auth.signOut(), [supabase])

  // Appelle une route API interne en joignant le jeton d'accès de l'utilisateur,
  // pour que le serveur puisse identifier qui fait la requête.
  const apiFetch = useCallback(
    async (url, options = {}) => {
      const token = session?.access_token
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
      const res = await fetch(url, { ...options, headers })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
      return data
    },
    [session]
  )

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      loading,
      signInWithEmail,
      signOut,
      apiFetch,
    }),
    [session, loading, signInWithEmail, signOut, apiFetch]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>')
  return ctx
}
