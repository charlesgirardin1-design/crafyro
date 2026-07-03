import { NextResponse } from 'next/server'
import { getSupabaseAdminClient, getUserFromRequest } from '../../../../lib/supabaseServer.js'

// GET /api/projects/:id
// Retourne le détail complet d'un projet : membres, contributions (avec leur
// feedback qualitatif), à condition que l'utilisateur en soit membre.
export async function GET(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const supabase = getSupabaseAdminClient()
  const { id } = params

  const { data: project, error: projErr } = await supabase.from('projects').select('*').eq('id', id).single()
  if (projErr || !project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })

  const { data: members, error: memErr } = await supabase
    .from('project_members')
    .select('*, users(id, pseudo, skills)')
    .eq('project_id', id)
    .order('joined_at', { ascending: true })

  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 })

  const isMember = (members || []).some((m) => m.user_id === user.id)
  if (!isMember) {
    // Projet visible mais contenu masqué tant qu'on n'a pas rejoint.
    return NextResponse.json({ project, members, isMember: false, contributions: [] })
  }

  const { data: contributions, error: contribErr } = await supabase
    .from('contributions')
    .select('*, users(id, pseudo), feedback(id, type, user_id), comments(id, content, user_id, created_at, users(pseudo))')
    .eq('project_id', id)
    .order('version', { ascending: true })

  if (contribErr) return NextResponse.json({ error: contribErr.message }, { status: 500 })

  return NextResponse.json({ project, members, isMember: true, contributions })
}

// PATCH /api/projects/:id
// Permet au créateur d'archiver manuellement un projet (statut "archived").
export async function PATCH(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = params
  const body = await request.json()
  const supabase = getSupabaseAdminClient()

  const { data: project } = await supabase.from('projects').select('creator_id').eq('id', id).single()
  if (!project || project.creator_id !== user.id) {
    return NextResponse.json({ error: 'Seul le créateur peut modifier ce projet.' }, { status: 403 })
  }

  const { error } = await supabase
    .from('projects')
    .update({ status: body.status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
