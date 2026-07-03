'use client'

import { useState } from 'react'
import { useAuth } from '../lib/AuthProvider.jsx'

const ACTIONS = [
  { value: 'idea', label: '💡 Proposer des idées' },
  { value: 'structure', label: '🧱 Structurer le projet' },
  { value: 'unblock', label: '🔓 Débloquer la situation' },
  { value: 'summarize', label: '📝 Résumer' },
]

// Assistant IA latéral : propose des idées, structure le projet, débloque une
// situation ou résume les contributions, à la demande (jamais automatique).
export default function AssistantPanel({ projectId }) {
  const { apiFetch } = useAuth()
  const [loading, setLoading] = useState(null)
  const [suggestion, setSuggestion] = useState('')
  const [error, setError] = useState('')

  const run = async (action) => {
    setLoading(action)
    setError('')
    setSuggestion('')
    try {
      const data = await apiFetch(`/api/projects/${projectId}/assistant`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      })
      setSuggestion(data.suggestion)
    } catch (err) {
      setError(err.message || 'Assistant indisponible.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-neutral-900 text-sm mb-3">🤖 Assistant du projet</h3>
      <div className="grid grid-cols-1 gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.value}
            onClick={() => run(a.value)}
            disabled={loading === a.value}
            className="text-left text-sm px-3 py-2 rounded-lg border border-neutral-200 hover:border-chain-300 hover:bg-chain-50 transition disabled:opacity-50"
          >
            {loading === a.value ? 'Réflexion...' : a.label}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

      {suggestion && (
        <div className="mt-4 bg-chain-50 border border-chain-100 rounded-lg p-3 text-sm text-neutral-700 leading-relaxed animate-fadeIn">
          {suggestion}
        </div>
      )}
    </div>
  )
}
