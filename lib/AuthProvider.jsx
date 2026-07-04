// -----------------------------------------------------------------------------
// AuthProvider.jsx
// Contexte React qui expose la session Supabase à toute l'application. Chaque
// visiteur est connecté automatiquement via une session anonyme (aucune saisie
// d'email/mot de passe requise), ce qui permet quand même à toutes les
// données (projets, contributions...) d'être stockées dans la vraie base de
// données partagée. signInWithEmail reste disponible si besoin plus tard.
// -----------------------------------------------------------------------------
'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from './supabaseClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const supabase = getSupabaseBrowserClient()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // Connexion automatique et invisible : chaque navigateur reçoit une vraie
  // session Supabase (utilisateur "anonyme" côté serveur), sans email ni mot de
  // passe. Cela permet aux projets/contributions d'être stockés dans la vraie
  // base de données partagée et donc synchronisés entre tout le monde, tout en
  // gardant l'expérience "sans connexion" pour la personne qui utilise l'app.
  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      if (data.session) {
        setSession(data.session)
        setLoading(false)
        return
      }
      const { data: anonData, error } = await supabase.auth.signInAnonymously()
      if (cancelled) return
      if (!error) setSession(anonData.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  const signInWithEmail = useCallback(
    async (email) => {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
      return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
    },
    [supabase]
  )

  const signOut = useCallback(() => supabase.auth.signOut(), [supabase])

  // Appelle une route API interne en joignant le jeton d'accès de l'utilisateur
  // (y compris pour les sessions anonymes), pour que le serveur puisse
  // identifier qui fait la requête et appliquer les bonnes règles RLS.
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
