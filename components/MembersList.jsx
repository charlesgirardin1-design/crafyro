'use client'

import { ROLES } from '../lib/roles.js'

export default function MembersList({ members, maxParticipants }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-neutral-900 text-sm">Membres</h3>
        <span className="text-xs text-neutral-400">
          {members.length} / {maxParticipants}
        </span>
      </div>
      <div className="space-y-2">
        {members.map((m) => {
          const roleMeta = ROLES[m.role] || ROLES.contributeur_idee
          return (
            <div key={m.id} className="flex items-center justify-between text-sm">
              <span className="text-neutral-700">{m.users?.pseudo || 'Membre'}</span>
              <span className={`badge ${roleMeta.color}`}>{roleMeta.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
