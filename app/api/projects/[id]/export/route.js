import { NextResponse } from 'next/server'
import { getSupabaseAdminClient, getUserFromRequest } from '../../../../../lib/supabaseServer.js'

// GET /api/projects/:id/export
// Retourne le contenu compilé du projet (titre, membres, contributions dans
// l'ordre des versions) au format JSON, pour être transformé en PDF/texte côté
// client (voir components/ExportButton.jsx).
export async function GET(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = params
  const supabase = getSupabaseAdminClient()

  const isMember = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!isMember.data) {
    return NextResponse.json({ error: 'Vous devez être membre du projet.' }, { status: 403 })
  }

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  const { data: members } = await supabase
    .from('project_members')
    .select('role, users(pseudo)')
    .eq('project_id', id)
  const { data: contributions } = await supabase
    .from('contributions')
    .select('content, version, created_at, users(pseudo)')
    .eq('project_id', id)
    .order('version', { ascending: true })

  return NextResponse.json({ project, members, contributions })
}
