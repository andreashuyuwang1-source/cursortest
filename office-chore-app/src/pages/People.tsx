import { useEffect, useMemo, useState } from 'react'
import { Plus, UserX, UserCheck, Pencil } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Divider, Field, TextInput } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import type { Person, Chore } from '../lib/types'
import { countOpenChoresForPerson, upsertById } from '../lib/mutate'
import { newId } from '../lib/id'

function PersonModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean
  initial?: Person
  onClose: () => void
  onSave: (p: Person) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
  }, [open, initial?.id])

  const canSave = name.trim().length > 0

  return (
    <Modal
      open={open}
      title={initial ? 'Edit person' : 'Add person'}
      description="People can be assigned chores. Deactivate people when they’re out of rotation."
      onClose={onClose}
      maxWidthClassName="max-w-lg"
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!canSave) return
          const now = new Date().toISOString()
          onSave({
            id: initial?.id ?? newId(),
            name: name.trim(),
            isActive: initial?.isActive ?? true,
            createdAt: initial?.createdAt ?? now,
          })
          onClose()
        }}
      >
        <Field label="Name" hint="Required">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Taylor" />
        </Field>

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

export function PeoplePage({
  people,
  chores,
  onChangePeople,
}: {
  people: Person[]
  chores: Chore[]
  onChangePeople: (next: Person[]) => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Person | undefined>(undefined)

  const active = useMemo(() => people.filter((p) => p.isActive), [people])
  const inactive = useMemo(() => people.filter((p) => !p.isActive), [people])

  const openNew = () => {
    setEditing(undefined)
    setModalOpen(true)
  }
  const openEdit = (p: Person) => {
    setEditing(p)
    setModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-base font-semibold text-slate-900">People</div>
            <div className="mt-1 text-sm text-slate-600">
              Add teammates and keep assignments up-to-date.
            </div>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            Add person
          </Button>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold text-slate-900">Active</div>
        <div className="mt-3 divide-y divide-slate-200">
          {active.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-600">No active people yet.</div>
          ) : (
            active.map((p) => {
              const openCount = countOpenChoresForPerson(chores, p.id)
              return (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">{p.name}</div>
                    <div className="mt-0.5 text-xs text-slate-600">{openCount} open chore(s)</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (!confirm(`Deactivate ${p.name}? They’ll remain on existing chores.`)) return
                        onChangePeople(upsertById(people, { ...p, isActive: false }))
                      }}
                      title="Deactivate"
                    >
                      <UserX className="h-4 w-4 text-slate-700" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold text-slate-900">Inactive</div>
        <div className="mt-3 divide-y divide-slate-200">
          {inactive.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-600">
              No inactive people. Nice.
            </div>
          ) : (
            inactive.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">{p.name}</div>
                  <div className="mt-0.5 text-xs text-slate-600">Inactive</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)} title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onChangePeople(upsertById(people, { ...p, isActive: true }))}
                    title="Reactivate"
                  >
                    <UserCheck className="h-4 w-4 text-emerald-700" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <PersonModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSave={(next) => onChangePeople(upsertById(people, next))}
      />
    </div>
  )
}

