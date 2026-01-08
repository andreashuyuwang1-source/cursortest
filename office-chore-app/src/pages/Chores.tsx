import { useEffect, useMemo, useState } from 'react'
import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Divider, Field, Select, TextArea, TextInput } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { PriorityBadge, StatusBadge } from '../components/ChoreBadges'
import type { Chore, ChorePriority, ChoreStatus, Person, Recurrence, UUID } from '../lib/types'
import { compareDueDates, isDueToday, isOverdue, safeFormatDate, todayISO } from '../lib/dates'
import { getPerson } from '../lib/mutate'
import { newId } from '../lib/id'

type ChoreDraft = {
  id?: UUID
  title: string
  description: string
  assigneeId: string // '' means unassigned
  dueDate: string // '' means none
  status: ChoreStatus
  priority: ChorePriority
  recurrenceKind: Recurrence['kind']
  interval: number
}

function toDraft(c?: Chore): ChoreDraft {
  if (!c) {
    return {
      title: '',
      description: '',
      assigneeId: '',
      dueDate: todayISO(),
      status: 'todo',
      priority: 'medium',
      recurrenceKind: 'none',
      interval: 1,
    }
  }
  return {
    id: c.id,
    title: c.title,
    description: c.description ?? '',
    assigneeId: c.assigneeId ?? '',
    dueDate: c.dueDate ?? '',
    status: c.status,
    priority: c.priority,
    recurrenceKind: c.recurrence.kind,
    interval:
      c.recurrence.kind === 'weekly'
        ? c.recurrence.intervalWeeks
        : c.recurrence.kind === 'monthly'
          ? c.recurrence.intervalMonths
          : 1,
  }
}

function fromDraft(d: ChoreDraft, nowIso: string, previous?: Chore): Chore {
  const recurrence: Recurrence =
    d.recurrenceKind === 'weekly'
      ? { kind: 'weekly', intervalWeeks: Math.max(1, d.interval) }
      : d.recurrenceKind === 'monthly'
        ? { kind: 'monthly', intervalMonths: Math.max(1, d.interval) }
        : { kind: 'none' }

  return {
    id: previous?.id ?? d.id ?? newId(),
    title: d.title.trim(),
    description: d.description.trim() ? d.description.trim() : undefined,
    assigneeId: d.assigneeId ? d.assigneeId : undefined,
    dueDate: d.dueDate ? d.dueDate : undefined,
    status: d.status,
    priority: d.priority,
    recurrence,
    createdAt: previous?.createdAt ?? nowIso,
    completedAt: d.status === 'done' ? previous?.completedAt ?? nowIso : undefined,
  }
}

function ChoreFormModal({
  open,
  people,
  initial,
  onClose,
  onSave,
}: {
  open: boolean
  people: Person[]
  initial?: Chore
  onClose: () => void
  onSave: (next: Chore) => void
}) {
  const [draft, setDraft] = useState<ChoreDraft>(() => toDraft(initial))

  // Reset draft on open / when switching chores.
  useEffect(() => {
    if (!open) return
    setDraft(toDraft(initial))
  }, [open, initial?.id])

  const isEdit = Boolean(initial)
  const title = isEdit ? 'Edit chore' : 'New chore'

  const activePeople = people.filter((p) => p.isActive)

  const canSave = draft.title.trim().length > 0

  return (
    <Modal
      open={open}
      title={title}
      description="Track what needs doing, who owns it, and when it’s due."
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!canSave) return
          const nowIso = new Date().toISOString()
          onSave(fromDraft(draft, nowIso, initial))
          onClose()
        }}
      >
        <Field label="Title" hint="Required">
          <TextInput
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="e.g. Refill printer paper"
            autoFocus
          />
        </Field>

        <Field label="Description" hint="Optional">
          <TextArea
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Notes, checklist items, or where supplies are stored."
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Assignee">
            <Select
              value={draft.assigneeId}
              onChange={(e) => setDraft((d) => ({ ...d, assigneeId: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {activePeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due date">
            <TextInput
              type="date"
              value={draft.dueDate}
              onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as ChoreStatus }))}
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </Select>
          </Field>
          <Field label="Priority">
            <Select
              value={draft.priority}
              onChange={(e) =>
                setDraft((d) => ({ ...d, priority: e.target.value as ChorePriority }))
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>
          <Field label="Repeat">
            <Select
              value={draft.recurrenceKind}
              onChange={(e) =>
                setDraft((d) => ({ ...d, recurrenceKind: e.target.value as Recurrence['kind'] }))
              }
            >
              <option value="none">No repeat</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>
          </Field>
        </div>

        {draft.recurrenceKind !== 'none' ? (
          <Field label="Repeat interval" hint="How often to recreate after completion">
            <div className="flex items-center gap-3">
              <TextInput
                type="number"
                min={1}
                value={draft.interval}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, interval: Number.parseInt(e.target.value || '1', 10) }))
                }
                className="max-w-28"
              />
              <div className="text-sm text-slate-700">
                {draft.recurrenceKind === 'weekly' ? 'week(s)' : 'month(s)'}
              </div>
            </div>
          </Field>
        ) : null}

        <Divider />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function ChoresPage({
  chores,
  people,
  onUpsert,
  onDelete,
  onComplete,
}: {
  chores: Chore[]
  people: Person[]
  onUpsert: (chore: Chore) => void
  onDelete: (id: UUID) => void
  onComplete: (id: UUID) => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Chore | undefined>(undefined)

  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ChoreStatus>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'unassigned' | UUID>('all')
  const [dueFilter, setDueFilter] = useState<'all' | 'overdue' | 'today' | 'no_due'>('all')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return chores
      .filter((c) => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false
        if (assigneeFilter !== 'all') {
          if (assigneeFilter === 'unassigned') {
            if (c.assigneeId) return false
          } else if (c.assigneeId !== assigneeFilter) return false
        }
        if (dueFilter === 'overdue') {
          if (c.status === 'done') return false
          if (!isOverdue(c.dueDate)) return false
        }
        if (dueFilter === 'today') {
          if (c.status === 'done') return false
          if (!isDueToday(c.dueDate)) return false
        }
        if (dueFilter === 'no_due') {
          if (c.dueDate) return false
        }
        if (query) {
          const hay = `${c.title} ${c.description ?? ''}`.toLowerCase()
          if (!hay.includes(query)) return false
        }
        return true
      })
      .slice()
      .sort((a, b) => {
        // Incomplete first, then by due date, then by title.
        if (a.status === 'done' && b.status !== 'done') return 1
        if (a.status !== 'done' && b.status === 'done') return -1
        const byDue = compareDueDates(a.dueDate, b.dueDate)
        if (byDue !== 0) return byDue
        return a.title.localeCompare(b.title)
      })
  }, [chores, q, statusFilter, assigneeFilter, dueFilter])

  const openNew = () => {
    setEditing(undefined)
    setModalOpen(true)
  }
  const openEdit = (c: Chore) => {
    setEditing(c)
    setModalOpen(true)
  }

  const activePeople = people.filter((p) => p.isActive)

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-base font-semibold text-slate-900">Chores</div>
            <div className="mt-1 text-sm text-slate-600">
              Create chores, assign them, and keep the office running smoothly.
            </div>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            New chore
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Field label="Search">
              <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, notes…" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-3">
            <Field label="Status">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | ChoreStatus)}
              >
                <option value="all">All</option>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </Select>
            </Field>
            <Field label="Assignee">
              <Select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value as 'all' | 'unassigned' | UUID)}
              >
                <option value="all">Anyone</option>
                <option value="unassigned">Unassigned</option>
                {activePeople.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Due">
              <Select value={dueFilter} onChange={(e) => setDueFilter(e.target.value as typeof dueFilter)}>
                <option value="all">Any</option>
                <option value="overdue">Overdue</option>
                <option value="today">Today</option>
                <option value="no_due">No due date</option>
              </Select>
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            Showing <span className="font-medium text-slate-900">{filtered.length}</span> chore(s)
          </div>
          <div className="text-xs text-slate-500">
            Tip: recurring chores create the next one when marked done.
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4">Chore</th>
                <th className="py-2 pr-4">Assignee</th>
                <th className="py-2 pr-4">Due</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Priority</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-slate-600">
                    No chores match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const person = getPerson(people, c.assigneeId)
                  const overdueFlag = c.status !== 'done' && isOverdue(c.dueDate)
                  const todayFlag = c.status !== 'done' && isDueToday(c.dueDate)
                  return (
                    <tr key={c.id} className="align-top">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-900">{c.title}</div>
                        {c.description ? (
                          <div className="mt-1 max-w-xl text-xs text-slate-600">
                            {c.description}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{person?.name ?? 'Unassigned'}</td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-slate-700">{safeFormatDate(c.dueDate)}</span>
                          {overdueFlag ? (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-800 ring-1 ring-rose-200">
                              Overdue
                            </span>
                          ) : null}
                          {todayFlag ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200">
                              Today
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3 pr-4">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(c)}
                            aria-label="Edit"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onComplete(c.id)}
                            aria-label="Mark done"
                            title="Mark done"
                            disabled={c.status === 'done'}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Delete chore “${c.title}”?`)) onDelete(c.id)
                            }}
                            aria-label="Delete"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ChoreFormModal
        open={modalOpen}
        people={people}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSave={(next) => onUpsert(next)}
      />
    </div>
  )
}

