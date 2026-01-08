import { Badge } from './ui/Badge'
import type { ChorePriority, ChoreStatus } from '../lib/types'

export function StatusBadge({ status }: { status: ChoreStatus }) {
  if (status === 'todo') return <Badge tone="slate">To do</Badge>
  if (status === 'in_progress') return <Badge tone="amber">In progress</Badge>
  return <Badge tone="emerald">Done</Badge>
}

export function PriorityBadge({ priority }: { priority: ChorePriority }) {
  if (priority === 'low') return <Badge tone="slate">Low</Badge>
  if (priority === 'medium') return <Badge tone="indigo">Medium</Badge>
  return <Badge tone="rose">High</Badge>
}

