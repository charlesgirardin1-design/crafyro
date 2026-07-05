'use client'

import { useRef, useState } from 'react'
import { useAuth } from '../lib/AuthProvider.jsx'
import DrawingCanvas from './DrawingCanvas.jsx'

// Zone de création rapide : ajoute la prochaine contribution versionnée
// (V1, V2, V3...) à la chaîne collective du projet.
// Pour les projets de type "design", la contribution se fait via une page
// blanche à dessiner (DrawingCanvas) plutôt qu'un champ de texte.
export default function AddContributionForm({ projectId, projectType, authorName, disabled, onAdded }) {
  const { apiFetch } = useAuth()
  const isDesign = projectType === 'design'
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef(null)

  const submit = async (e) => {
    e.preventDefault()
    const payload = isDesign ? canvasRef.current?.exportImage() : content
    if (!isDesign && !content.trim()) return
    if (isDesign && !payload) return
    setLoading(true)
    setError('')
    try {
      await apiFetch(`/api/projects/${projectId}/contributions`, {
        method: 'POST',
        body: JSON.stringify({ content: payload }),
      })
      setContent('')
      canvasRef.current?.clear()
      onAdded?.()
    } catch (err) {
      setError(err.message || 'Impossible d\'ajouter la contribution.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="card p-4">
      {isDesign ? (
        <DrawingCanvas ref={canvasRef} disabled={disabled} authorName={authorName} />
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Ajoutez la suite de la chaîne : une idée, un couplet, un paragraphe, une structure..."
          className="input-field resize-none"
        />
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <div className="flex justify-end mt-2">
        <button type="submit" disabled={disabled || loading} className="btn-primary text-sm">
          {loading ? 'Ajout...' : 'Ajouter à la chaîne'}
        </button>
      </div>
    </form>
  )
}
