// -----------------------------------------------------------------------------
// supabaseServer.js
// Client Supabase utilisable uniquement côté serveur (routes API / route
// handlers). Utilise la clé "service role" qui contourne le RLS : elle ne doit
// JAMAIS être exposée au navigateur. Variables d'environnement nécessaires :
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (à ajouter dans le dashboard Vercel,
// section Environment Variables, jamais dans le code).
// -----------------------------------------------------------------------------
import { createClient } from '@supabase/supabase-js'

export function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase non configuré : ajoutez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans les variables d\'environnement Vercel.'
    )
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Récupère l'utilisateur courant à partir du token d'accès envoyé par le client
// (Authorization: Bearer <token>), pour vérifier qui appelle une route API.
export async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return null

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}
