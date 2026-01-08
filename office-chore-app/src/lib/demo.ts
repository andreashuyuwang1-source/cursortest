import { newId } from './id'
import type { Chore, Person, PersistedAppDataV1 } from './types'
import { todayISO } from './dates'
import { addDays, format } from 'date-fns'

export function makeDemoData(): PersistedAppDataV1 {
  const now = new Date().toISOString()
  const people: Person[] = [
    { id: newId(), name: 'Avery', isActive: true, createdAt: now },
    { id: newId(), name: 'Sam', isActive: true, createdAt: now },
    { id: newId(), name: 'Jordan', isActive: true, createdAt: now },
  ]

  const d = (offsetDays: number) => format(addDays(new Date(), offsetDays), 'yyyy-MM-dd')
  const chores: Chore[] = [
    {
      id: newId(),
      title: 'Empty dishwasher',
      description: 'Unload clean dishes and start a new cycle if needed.',
      assigneeId: people[0]?.id,
      dueDate: todayISO(),
      status: 'todo',
      priority: 'medium',
      recurrence: { kind: 'weekly', intervalWeeks: 1 },
      createdAt: now,
    },
    {
      id: newId(),
      title: 'Wipe kitchen counters',
      description: 'Disinfect countertops and the sink area.',
      assigneeId: people[1]?.id,
      dueDate: d(1),
      status: 'in_progress',
      priority: 'high',
      recurrence: { kind: 'weekly', intervalWeeks: 1 },
      createdAt: now,
    },
    {
      id: newId(),
      title: 'Restock coffee + tea',
      description: 'Check supplies and top up the kitchen cart.',
      assigneeId: people[2]?.id,
      dueDate: d(3),
      status: 'todo',
      priority: 'low',
      recurrence: { kind: 'monthly', intervalMonths: 1 },
      createdAt: now,
    },
  ]

  return { version: 1, people, chores }
}

