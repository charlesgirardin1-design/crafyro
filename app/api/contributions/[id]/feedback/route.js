import { NextResponse } from 'next/server'
import { getSupabaseAdminClient, getUserFromRequest } from '../../../../../lib/supabaseServer.js'

// POST /api/contributions/:id/feedback
// Ajoute (ou retire si déjà présent) un feedback qualitatif — jamais de like
// public classique, seulement : utile / inspirant / clair / créatif.
export async function POST(request, { params }) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = params
  const { type } = await request.json()
  const allowed = ['utile', 'inspirant', 'clair', 'creatif']
  if (!allowed.includes(type)) {
    return NextResponse.json({ error: 'Type de feedback invalide.' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()

  const { data: existing } = await supabase
    .from('feedback')
    .select('id')
    .eq('contribution_id', id)
    .eq('user_id', user.id)
    .eq('type', type)
    .maybeSingle()

  if (existing) {
    await supabase.from('feedback').delete().eq('id', existing.id)
    return NextResponse.json({ toggled: 'removed' })
  }

  const { error } = await supabase.from('feedback').insert({ contribution_id: id, user_id: user.id, type })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ toggled: 'added' })
}
