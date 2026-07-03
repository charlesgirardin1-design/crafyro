import { NextResponse } from 'next/server'
import { getSupabaseAdminClient, getUserFromRequest } from '../../../lib/supabaseServer.js'

// GET /api/projects
// Retourne les projets actifs auxquels l'utilisateur participe, et une liste de
// suggestions (matchmaking simple basé sur ses compétences déclarées).
export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const supabase = getSupabaseAdminClient()

  const { data: myMemberships, error: memErr } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id)

  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 })

  const myProjectIds = (myMemberships || []).map((m) => m.project_id)

  const { data: myProjects, error: projErr } = await supabase
    .from('projects')
    .select('*, project_members(count), contributions(count)')
    .in('id', myProjectIds.length ? myProjectIds : ['00000000-0000-0000-0000-000000000000'])
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })

  if (projErr) return NextResponse.json({ error: projErr.message }, { status: 500 })

  const { data: profile } = await supabase.from('users').select('skills').eq('id', user.id).single()
  const mySkills = profile?.skills || []

  const { data: candidates, error: candErr } = await supabase
    .from('projects')
    .select('*, project_members(count), contributions(count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(30)

  if (candErr) return NextResponse.json({ error: candErr.message }, { status: 500 })

  const suggested = (candidates || [])
    .filter((p) => !myProjectIds.includes(p.id))
    .filter((p) => (p.project_members?.[0]?.count || 0) < p.max_participants)
    .sort((a, b) => {
      const aMatch = mySkills.includes(a.type) ? 1 : 0
      const bMatch = mySkills.includes(b.type) ? 1 : 0
      return bMatch - aMatch
    })
    .slice(0, 6)

  return NextResponse.json({
    active: normalize(myProjects),
    suggested: normalize(suggested),
  })
}

function normalize(rows) {
  return (rows || []).map((p) => ({
    ...p,
    member_count: p.project_members?.[0]?.count || 0,
    contribution_count: p.contributions?.[0]?.count || 0,
  }))
}

// POST /api/projects
// Crée un nouveau projet ; le créateur devient automatiquement membre avec le
// rôle "initiateur".
export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { title, description, type, objective, max_participants } = body

  if (!title || !type) {
    return NextResponse.json({ error: 'Titre et type sont obligatoires.' }, { status: 400 })
  }

  const maxP = Math.min(10, Math.max(2, Number(max_participants) || 6))

  const supabase = getSupabaseAdminClient()

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      title,
      description: description || '',
      type,
      objective: objective || '',
      max_participants: maxP,
      creator_id: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { error: memberError } = await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: user.id,
    role: 'initiateur',
  })

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

  return NextResponse.json({ project })
}
