'use client'

import { useState } from 'react'
import { useAuth } from '../lib/AuthProvider.jsx'

// Zone de création rapide : ajoute la prochaine contribution versionnée
// (V1, V2, V3...) à la chaîne collective du projet.
export default function AddContributionForm({ projectId, disabled, onAdded }) {
  const { apiFetch } = useAuth()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setError('')
    try {
      await apiFetch(`/api/projects/${projectId}/contributions`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      setContent('')
      onAdded?.()
    } catch (err) {
      setError(err.message || 'Impossible d\'ajouter la contribution.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="card p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={disabled}
        rows={3}
        placeholder="Ajoutez la suite de la chaîne : une idée, un couplet, un paragraphe, une structure..."
        className="input-field resize-none"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <div className="flex justify-end mt-2">
        <button type="submit" disabled={disabled || loading} className="btn-primary text-sm">
          {loading ? 'Ajout...' : 'Ajouter à la chaîne'}
        </button>
      </div>
    </form>
  )
}
