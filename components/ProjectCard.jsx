'use client'

import Link from 'next/link'
import { getProjectTypeMeta, daysLeft } from '../lib/projectTypes.js'

export default function ProjectCard({ project }) {
  const meta = getProjectTypeMeta(project.type)
  const left = daysLeft(project.expires_at)
  const memberCount = project.member_count ?? project.project_members?.length ?? 0

  return (
    <Link href={`/projects/${project.id}`} className="card p-5 block">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            {meta.icon}
          </span>
          <div>
            <h3 className="font-semibold text-neutral-900 leading-tight">{project.title}</h3>
            <span className="badge badge-chain mt-1">{meta.label}</span>
          </div>
        </div>
        <span className={`badge ${left <= 2 ? 'badge-spark' : 'badge-neutral'} shrink-0`}>
          {left} j restant{left > 1 ? 's' : ''}
        </span>
      </div>

      <p className="text-sm text-neutral-500 mt-3 line-clamp-2">{project.description}</p>

      <div className="flex items-center justify-between mt-4 text-xs text-neutral-400">
        <span>
          {memberCount} / {project.max_participants} participants
        </span>
        <span>{project.contribution_count ?? 0} contributions</span>
      </div>
    </Link>
  )
}
