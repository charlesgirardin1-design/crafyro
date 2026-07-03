// -----------------------------------------------------------------------------
// roles.js
// Détermine le rôle dynamique d'un membre dans un projet, en fonction de son
// activité. Logique simple pour le MVP : le rôle évolue avec le nombre de
// contributions apportées et la nature de ces contributions.
// -----------------------------------------------------------------------------

export const ROLES = {
  initiateur: { label: 'Initiateur', color: 'badge-spark' },
  contributeur_idee: { label: 'Contributeur idée', color: 'badge-chain' },
  createur_contenu: { label: 'Créateur contenu', color: 'badge-chain' },
  editeur: { label: 'Éditeur / structuration', color: 'badge-neutral' },
}

// Calcule le rôle suggéré pour un membre à partir de son nombre de
// contributions. Le créateur du projet reste "initiateur" tant qu'il est actif.
export function computeDynamicRole({ isCreator, contributionCount }) {
  if (isCreator && contributionCount < 3) return 'initiateur'
  if (contributionCount === 0) return 'contributeur_idee'
  if (contributionCount >= 6) return 'editeur'
  if (contributionCount >= 2) return 'createur_contenu'
  return 'contributeur_idee'
}
