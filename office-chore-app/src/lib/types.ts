export type UUID = string

export type ChoreStatus = 'todo' | 'in_progress' | 'done'
export type ChorePriority = 'low' | 'medium' | 'high'

export type Recurrence =
  | { kind: 'none' }
  | { kind: 'weekly'; intervalWeeks: number }
  | { kind: 'monthly'; intervalMonths: number }

export type Person = {
  id: UUID
  name: string
  isActive: boolean
  createdAt: string // ISO datetime
}

export type Chore = {
  id: UUID
  title: string
  description?: string
  assigneeId?: UUID
  dueDate?: string // ISO date (yyyy-MM-dd)
  status: ChoreStatus
  priority: ChorePriority
  recurrence: Recurrence
  createdAt: string // ISO datetime
  completedAt?: string // ISO datetime
}

export type PersistedAppDataV1 = {
  version: 1
  people: Person[]
  chores: Chore[]
}
