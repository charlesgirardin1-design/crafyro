// -----------------------------------------------------------------------------
// demoApi.js
// TEMPORAIRE : simulateur d'API basé sur localStorage, utilisé uniquement en
// mode "invité" (GUEST_BYPASS) tant qu'aucun vrai Supabase n'est connecté.
// Permet de créer des projets, contribuer, etc. sans backend réel — les
// données restent uniquement dans le navigateur de la personne qui teste.
// À supprimer une fois Supabase configuré (voir lib/AuthProvider.jsx).
// -----------------------------------------------------------------------------

const STORAGE_KEY = 'chaincraft_demo_data'
const GUEST_ID = 'guest-temp'
const GUEST_PSEUDO = 'Vous'

function loadData() {
  if (typeof window === 'undefined') return { projects: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { projects: [] }
  } catch {
    return { projects: [] }
  }
}

function saveData(data) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function uid() {
  return 'demo-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function withCounts(project) {
  return {
    ...project,
    member_count: project.members.length,
    contribution_count: project.contributions.length,
  }
}

function computeRole(project, isCreator, contributionCount) {
  if (isCreator && contributionCount < 3) return 'initiateur'
  if (contributionCount >= 6) return 'editeur'
  if (contributionCount >= 2) return 'createur_contenu'
  return 'contributeur_idee'
}

// Route une requête interceptée vers la logique "démo" et renvoie une réponse
// au même format que les vraies routes API (JSON, ok/erreur).
export async function handleDemoRequest(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const body = options.body ? JSON.parse(options.body) : {}
  const data = loadData()

  // GET /api/projects
  if (url === '/api/projects' && method === 'GET') {
    const active = data.projects
      .filter((p) => p.members.some((m) => m.user_id === GUEST_ID) && p.status !== 'deleted')
      .map(withCounts)
    const suggested = data.projects
      .filter((p) => !p.members.some((m) => m.user_id === GUEST_ID) && p.status === 'active')
      .map(withCounts)
      .slice(0, 6)
    return { active, suggested }
  }

  // POST /api/projects
  if (url === '/api/projects' && method === 'POST') {
    if (!body.title || !body.type) {
      throw new Error('Titre et type sont obligatoires.')
    }
    const now = Date.now()
    const project = {
      id: uid(),
      title: body.title,
      description: body.description || '',
      type: body.type,
      objective: body.objective || '',
      max_participants: Math.min(10, Math.max(2, Number(body.max_participants) || 6)),
      status: 'active',
      creator_id: GUEST_ID,
      created_at: new Date(now).toISOString(),
      expires_at: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(),
      members: [{ id: uid(), user_id: GUEST_ID, users: { id: GUEST_ID, pseudo: GUEST_PSEUDO }, role: 'initiateur' }],
      contributions: [],
    }
    data.projects.unshift(project)
    saveData(data)
    return { project }
  }

  // Routes /api/projects/:id/...
  const projectMatch = url.match(/^\/api\/projects\/([^/]+)(\/.*)?$/)
  if (projectMatch) {
    const projectId = projectMatch[1]
    const rest = projectMatch[2] || ''
    const project = data.projects.find((p) => p.id === projectId)
    if (!project) throw new Error('Projet introuvable.')
    const isMember = project.members.some((m) => m.user_id === GUEST_ID)

    // GET /api/projects/:id
    if (rest === '' && method === 'GET') {
      return {
        project: withCounts(project),
        members: project.members,
        isMember,
        contributions: isMember ? project.contributions : [],
      }
    }

    // POST /api/projects/:id/join
    if (rest === '/join' && method === 'POST') {
      if (!isMember) {
        if (project.members.length >= project.max_participants) {
          throw new Error('Ce projet est complet.')
        }
        project.members.push({
          id: uid(),
          user_id: GUEST_ID,
          users: { id: GUEST_ID, pseudo: GUEST_PSEUDO },
          role: 'contributeur_idee',
        })
        saveData(data)
      }
      return { ok: true }
    }

    // POST /api/projects/:id/contributions
    if (rest === '/contributions' && method === 'POST') {
      if (!isMember) throw new Error('Vous devez rejoindre ce projet avant de contribuer.')
      if (project.status !== 'active') throw new Error('Ce projet n\'accepte plus de contributions.')
      const version = project.contributions.length + 1
      const contribution = {
        id: uid(),
        version,
        content: body.content,
        user_id: GUEST_ID,
        users: { id: GUEST_ID, pseudo: GUEST_PSEUDO },
        created_at: new Date().toISOString(),
        feedback: [],
        comments: [],
      }
      project.contributions.push(contribution)
      const member = project.members.find((m) => m.user_id === GUEST_ID)
      if (member) member.role = computeRole(project, project.creator_id === GUEST_ID, version)
      saveData(data)
      return { contribution }
    }

    // GET /api/projects/:id/export
    if (rest === '/export' && method === 'GET') {
      return { project: withCounts(project), members: project.members, contributions: project.contributions }
    }

    // POST /api/projects/:id/assistant
    if (rest === '/assistant' && method === 'POST') {
      return {
        suggestion:
          "L'assistant IA nécessite une clé Gemini configurée dans Vercel (GEMINI_API_KEY). En mode démo local, cette fonctionnalité n'est pas simulée.",
      }
    }
  }

  // POST /api/contributions/:id/feedback
  const feedbackMatch = url.match(/^\/api\/contributions\/([^/]+)\/feedback$/)
  if (feedbackMatch && method === 'POST') {
    const contributionId = feedbackMatch[1]
    for (const project of data.projects) {
      const contribution = project.contributions.find((c) => c.id === contributionId)
      if (contribution) {
        const existingIndex = contribution.feedback.findIndex(
          (f) => f.user_id === GUEST_ID && f.type === body.type
        )
        if (existingIndex >= 0) {
          contribution.feedback.splice(existingIndex, 1)
        } else {
          contribution.feedback.push({ id: uid(), user_id: GUEST_ID, type: body.type })
        }
        saveData(data)
        return { ok: true }
      }
    }
    throw new Error('Contribution introuvable.')
  }

  // POST /api/contributions/:id/comments
  const commentMatch = url.match(/^\/api\/contributions\/([^/]+)\/comments$/)
  if (commentMatch && method === 'POST') {
    const contributionId = commentMatch[1]
    for (const project of data.projects) {
      const contribution = project.contributions.find((c) => c.id === contributionId)
      if (contribution) {
        const comment = {
          id: uid(),
          content: body.content,
          user_id: GUEST_ID,
          created_at: new Date().toISOString(),
          users: { pseudo: GUEST_PSEUDO },
        }
        contribution.comments.push(comment)
        saveData(data)
        return { comment }
      }
    }
    throw new Error('Contribution introuvable.')
  }

  throw new Error(`Route de démo non gérée : ${method} ${url}`)
}
