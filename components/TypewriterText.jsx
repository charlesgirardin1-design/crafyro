'use client'

import { useEffect, useState } from 'react'

// -----------------------------------------------------------------------------
// TypewriterText.jsx
// Révèle un texte caractère par caractère (effet "machine à écrire"), avec un
// curseur clignotant tant que la révélation n'est pas terminée. Utilisé pour
// les réponses de l'assistant IA, afin de donner l'impression qu'il "écrit"
// sa suggestion plutôt que de l'afficher d'un bloc.
// -----------------------------------------------------------------------------
export default function TypewriterText({ text, speed = 16, className }) {
  const [shown, setShown] = useState('')

  useEffect(() => {
    setShown('')
    if (!text) return undefined
    let i = 0
    const id = setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])

  const done = shown.length >= (text || '').length

  return (
    <span className={className}>
      {shown}
      {!done && <span className="typing-caret" aria-hidden />}
    </span>
  )
}
