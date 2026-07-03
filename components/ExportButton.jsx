'use client'

import { useState } from 'react'
import { useAuth } from '../lib/AuthProvider.jsx'

// Génère un export basique (PDF) du projet compilé : titre, membres,
// contributions dans l'ordre des versions. Utilise jsPDF côté client, sans
// dépendance serveur supplémentaire.
export default function ExportButton({ projectId }) {
  const { apiFetch } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleExport = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch(`/api/projects/${projectId}/export`)
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      const marginX = 14
      let y = 18

      doc.setFontSize(18)
      doc.text(data.project.title, marginX, y)
      y += 8
      doc.setFontSize(10)
      doc.setTextColor(120)
      doc.text(`Type : ${data.project.type} — Objectif : ${data.project.objective || '—'}`, marginX, y)
      y += 10

      doc.setTextColor(0)
      doc.setFontSize(12)
      doc.text('Participants', marginX, y)
      y += 6
      doc.setFontSize(10)
      ;(data.members || []).forEach((m) => {
        doc.text(`- ${m.users?.pseudo || 'membre'} (${m.role})`, marginX, y)
        y += 5
      })

      y += 6
      doc.setFontSize(12)
      doc.text('Contributions', marginX, y)
      y += 6
      doc.setFontSize(10)

      ;(data.contributions || []).forEach((c) => {
        if (y > 270) {
          doc.addPage()
          y = 18
        }
        const lines = doc.splitTextToSize(`V${c.version} — ${c.users?.pseudo || 'membre'} : ${c.content}`, 180)
        doc.text(lines, marginX, y)
        y += lines.length * 5 + 4
      })

      doc.save(`${data.project.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`)
    } catch (err) {
      setError(err.message || 'Export impossible.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleExport} disabled={loading} className="btn-secondary text-sm">
        {loading ? 'Génération...' : '📄 Exporter en PDF'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
