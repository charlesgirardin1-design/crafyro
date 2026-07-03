// -----------------------------------------------------------------------------
// supabaseClient.js
// Client Supabase utilisable côté navigateur (composants "use client").
// Nécessite les variables d'environnement NEXT_PUBLIC_SUPABASE_URL et
// NEXT_PUBLIC_SUPABASE_ANON_KEY (à ajouter dans le dashboard Vercel).
// -----------------------------------------------------------------------------
'use client'

import { createBrowserClient } from '@supabase/ssr'

let browserClient

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return browserClient
}
