// Types de projets disponibles + présentation associée (icône, libellé, thème
// de couleur). Chaque type a sa propre identité visuelle (dégradé d'icône,
// badge, anneau de sélection) pour repérer un projet en un coup d'œil.
export const PROJECT_TYPES = [
  {
    value: 'texte',
    label: 'Texte',
    icon: '✍️',
    hint: 'Histoire, script, idée écrite',
    iconBg: 'bg-gradient-to-br from-sky-400 to-sky-600',
    badgeBg: 'bg-sky-50 text-sky-700',
    ring: 'ring-sky-300',
    border: 'border-sky-400',
    soft: 'bg-sky-50 border-sky-400 text-sky-700',
  },
  {
    value: 'musique',
    label: 'Musique',
    icon: '🎵',
    hint: 'Paroles, structure de morceau',
    iconBg: 'bg-gradient-to-br from-rose-400 to-rose-600',
    badgeBg: 'bg-rose-50 text-rose-700',
    ring: 'ring-rose-300',
    border: 'border-rose-400',
    soft: 'bg-rose-50 border-rose-400 text-rose-700',
  },
  {
    value: 'design',
    label: 'Design',
    icon: '🎨',
    hint: 'Concept visuel décrit',
    iconBg: 'bg-gradient-to-br from-violet-400 to-chain-600',
    badgeBg: 'bg-violet-50 text-violet-700',
    ring: 'ring-violet-300',
    border: 'border-violet-400',
    soft: 'bg-violet-50 border-violet-400 text-violet-700',
  },
  {
    value: 'brainstorm',
    label: 'Brainstorm',
    icon: '💡',
    hint: "Idée de startup, marketing...",
    iconBg: 'bg-gradient-to-br from-amber-400 to-spark-600',
    badgeBg: 'bg-amber-50 text-amber-700',
    ring: 'ring-amber-300',
    border: 'border-amber-400',
    soft: 'bg-amber-50 border-amber-400 text-amber-700',
  },
  {
    value: 'mixed',
    label: 'Mixte',
    icon: '🧩',
    hint: 'Combinaison libre',
    iconBg: 'bg-gradient-to-br from-teal-400 to-teal-600',
    badgeBg: 'bg-teal-50 text-teal-700',
    ring: 'ring-teal-300',
    border: 'border-teal-400',
    soft: 'bg-teal-50 border-teal-400 text-teal-700',
  },
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
