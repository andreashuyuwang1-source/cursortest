import type { Chore, Person, UUID } from './types'

export function upsertById<T extends { id: UUID }>(items: T[], next: T): T[] {
  const idx = items.findIndex((i) => i.id === next.id)
  if (idx === -1) return [next, ...items]
  const copy = items.slice()
  copy[idx] = next
  return copy
}

export function removeById<T extends { id: UUID }>(items: T[], id: UUID): T[] {
  return items.filter((i) => i.id !== id)
}

export function countOpenChoresForPerson(chores: Chore[], personId: UUID): number {
  return chores.filter((c) => c.assigneeId === personId && c.status !== 'done').length
}

export function getPerson(people: Person[], id?: UUID): Person | undefined {
  if (!id) return undefined
  return people.find((p) => p.id === id)
}

