import { addMonths, addWeeks, format, isAfter, isBefore, isValid, parseISO, startOfDay } from 'date-fns'
import type { Recurrence } from './types'

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function parseISODateOnly(dateIso?: string): Date | undefined {
  if (!dateIso) return undefined
  const d = parseISO(dateIso)
  if (!isValid(d)) return undefined
  return d
}

export function isOverdue(dueDateIso?: string): boolean {
  const due = parseISODateOnly(dueDateIso)
  if (!due) return false
  return isBefore(startOfDay(due), startOfDay(new Date()))
}

export function isDueToday(dueDateIso?: string): boolean {
  const due = parseISODateOnly(dueDateIso)
  if (!due) return false
  const t = startOfDay(new Date())
  const d = startOfDay(due)
  return d.getTime() === t.getTime()
}

export function safeFormatDate(dateIso?: string): string {
  const d = parseISODateOnly(dateIso)
  if (!d) return '—'
  return format(d, 'MMM d, yyyy')
}

export function nextDueDateFrom(dueDateIso: string | undefined, recurrence: Recurrence): string | undefined {
  if (!dueDateIso) return undefined
  const due = parseISODateOnly(dueDateIso)
  if (!due) return undefined

  if (recurrence.kind === 'weekly') {
    const next = addWeeks(due, Math.max(1, recurrence.intervalWeeks))
    return format(next, 'yyyy-MM-dd')
  }
  if (recurrence.kind === 'monthly') {
    const next = addMonths(due, Math.max(1, recurrence.intervalMonths))
    return format(next, 'yyyy-MM-dd')
  }
  return undefined
}

export function compareDueDates(a?: string, b?: string): number {
  const da = parseISODateOnly(a)
  const db = parseISODateOnly(b)
  if (!da && !db) return 0
  if (!da) return 1
  if (!db) return -1
  if (isBefore(da, db)) return -1
  if (isAfter(da, db)) return 1
  return 0
}

