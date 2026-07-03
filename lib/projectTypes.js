// Types de projets disponibles + présentation associée (icône, libellé, couleur).
export const PROJECT_TYPES = [
  { value: 'texte', label: 'Texte', icon: '✍️', hint: 'Histoire, script, idée écrite' },
  { value: 'musique', label: 'Musique', icon: '🎵', hint: 'Paroles, structure de morceau' },
  { value: 'design', label: 'Design', icon: '🎨', hint: 'Concept visuel décrit' },
  { value: 'brainstorm', label: 'Brainstorm', icon: '💡', hint: 'Idée de startup, marketing...' },
  { value: 'mixed', label: 'Mixte', icon: '🧩', hint: 'Combinaison libre' },
]

export function getProjectTypeMeta(type) {
  return PROJECT_TYPES.find((t) => t.value === type) || PROJECT_TYPES[4]
}

export const FEEDBACK_TYPES = [
  { value: 'utile', label: 'Utile', icon: '🛠️' },
  { value: 'inspirant', label: 'Inspirant', icon: '✨' },
  { value: 'clair', label: 'Clair', icon: '🔍' },
  { value: 'creatif', label: 'Créatif', icon: '🌟' },
]

// Nombre de jours restants avant expiration (30 jours après création).
export function daysLeft(expiresAt) {
  const ms = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

export function isExpiringSoon(expiresAt) {
  const hoursLeft = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)
  return hoursLeft <= 48 && hoursLeft > 0
}
