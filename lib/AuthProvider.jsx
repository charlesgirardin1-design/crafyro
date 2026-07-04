// -----------------------------------------------------------------------------
// AuthProvider.jsx
// Contexte React qui expose la session Supabase (connexion par lien magique,
// sans mot de passe) à toute l'application, ainsi que quelques helpers d'appel
// API qui joignent automatiquement le jeton d'accès de l'utilisateur connecté.
// -----------------------------------------------------------------------------
'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from './supabaseClient.js'
import { handleDemoRequest } from './demoApi.js'

const AuthContext = createContext(null)

// -----------------------------------------------------------------------------
// Supabase est maintenant configuré (vraies variables d'environnement) : la
// connexion par lien magique est requise pour que les projets soient partagés
// entre tous les utilisateurs (synchronisation réelle via la base de données).
// -----------------------------------------------------------------------------
const GUEST_BYPASS = false
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
  // En mode invité (GUEST_BYPASS), les appels /api/... sont interceptés et
  // simulés localement (localStorage) puisqu'il n'y a pas de vrai backend.
  const apiFetch = useCallback(
    async (url, options = {}) => {
      if (GUEST_BYPASS && url.startsWith('/api/')) {
        return handleDemoRequest(url, options)
      }
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
