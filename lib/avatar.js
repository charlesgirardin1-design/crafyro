// Avatars générés (initiales + dégradé de couleur déterministe) pour
// représenter membres et auteurs sans dépendre d'images uploadées. La couleur
// est dérivée du pseudo pour rester stable dans le temps.
const HUE_PAIRS = [
  [262, 292], // violet -> rose-violet
  [199, 231], // bleu ciel -> bleu
  [340, 10], // rose -> rouge
  [26, 46], // orange -> ambre
  [166, 190], // teal -> cyan
  [280, 320], // pourpre -> magenta
]

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function initials(name) {
  const clean = (name || '').trim()
  if (!clean) return '?'
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function avatarGradient(name) {
  const seed = hashString(name || 'anonyme')
  const [h1, h2] = HUE_PAIRS[seed % HUE_PAIRS.length]
  return `linear-gradient(135deg, hsl(${h1}, 78%, 58%), hsl(${h2}, 72%, 50%))`
}

export function avatarStyle(name) {
  return { backgroundImage: avatarGradient(name) }
}
