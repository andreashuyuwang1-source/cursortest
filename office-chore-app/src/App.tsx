import { useMemo, useState } from 'react'
import { LayoutDashboard, ListChecks, Settings, Users } from 'lucide-react'
import { Button } from './components/ui/Button'
import { Card } from './components/ui/Card'
import { Dashboard } from './pages/Dashboard'
import { ChoresPage } from './pages/Chores'
import { PeoplePage } from './pages/People'
import { SettingsPage } from './pages/Settings'
import type { Chore, PersistedAppDataV1, UUID } from './lib/types'
import { loadAppData, saveAppData, exportAppData, importAppData, clearAppData } from './lib/storage'
import { useDebouncedEffect } from './lib/hooks'
import { makeDemoData } from './lib/demo'
import { nextDueDateFrom, todayISO } from './lib/dates'
import { newId } from './lib/id'
import { removeById, upsertById } from './lib/mutate'

type Tab = 'dashboard' | 'chores' | 'people' | 'settings'

function NavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
        active ? 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200' : 'text-slate-700 hover:bg-slate-100',
      ].join(' ')}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  )
}

const EMPTY: PersistedAppDataV1 = { version: 1, people: [], chores: [] }

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [data, setData] = useState<PersistedAppDataV1>(() => loadAppData() ?? EMPTY)

  useDebouncedEffect(() => saveAppData(data), 250, [data])

  const isEmpty = data.people.length === 0 && data.chores.length === 0

  const activeCount = useMemo(
    () => data.chores.filter((c) => c.status !== 'done').length,
    [data.chores],
  )

  const upsertChore = (chore: Chore) => {
    setData((d) => ({ ...d, chores: upsertById(d.chores, chore) }))
  }

  const deleteChore = (id: UUID) => {
    setData((d) => ({ ...d, chores: removeById(d.chores, id) }))
  }

  const completeChore = (id: UUID) => {
    setData((d) => {
      const existing = d.chores.find((c) => c.id === id)
      if (!existing || existing.status === 'done') return d
      const now = new Date().toISOString()

      const completed: Chore = { ...existing, status: 'done', completedAt: now }
      let nextChores = upsertById(d.chores, completed)

      if (existing.recurrence.kind !== 'none') {
        const baseDue = existing.dueDate ?? todayISO()
        const nextDue = nextDueDateFrom(baseDue, existing.recurrence)
        if (nextDue) {
          const next: Chore = {
            ...existing,
            id: newId(),
            status: 'todo',
            dueDate: nextDue,
            createdAt: now,
            completedAt: undefined,
          }
          nextChores = upsertById(nextChores, next)
        }
      }

      return { ...d, chores: nextChores }
    })
  }

  const content = (() => {
    if (tab === 'dashboard') return <Dashboard chores={data.chores} people={data.people} />
    if (tab === 'chores')
      return (
        <ChoresPage
          chores={data.chores}
          people={data.people}
          onUpsert={upsertChore}
          onDelete={deleteChore}
          onComplete={completeChore}
        />
      )
    if (tab === 'people')
      return (
        <PeoplePage
          people={data.people}
          chores={data.chores}
          onChangePeople={(next) => setData((d) => ({ ...d, people: next }))}
        />
      )
    return (
      <SettingsPage
        exportJson={() => exportAppData(data)}
        onImportJson={(raw) => setData(importAppData(raw))}
        onClearAll={() => {
          clearAppData()
          setData(EMPTY)
        }}
        onLoadDemo={() => setData(makeDemoData())}
      />
    )
  })()

  return (
    <div className="min-h-full">
      <div className="mx-auto flex min-h-full max-w-7xl flex-col gap-4 p-4 sm:flex-row sm:gap-6">
        <aside className="sm:w-64">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Office Chore Board</div>
                <div className="mt-1 text-xs text-slate-600">{activeCount} open chore(s)</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-1">
              <NavItem
                active={tab === 'dashboard'}
                onClick={() => setTab('dashboard')}
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="Dashboard"
              />
              <NavItem
                active={tab === 'chores'}
                onClick={() => setTab('chores')}
                icon={<ListChecks className="h-4 w-4" />}
                label="Chores"
              />
              <NavItem
                active={tab === 'people'}
                onClick={() => setTab('people')}
                icon={<Users className="h-4 w-4" />}
                label="People"
              />
              <NavItem
                active={tab === 'settings'}
                onClick={() => setTab('settings')}
                icon={<Settings className="h-4 w-4" />}
                label="Settings"
              />
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-4">
          {isEmpty ? (
            <Card>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-base font-semibold text-slate-900">Welcome</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Add people, then create chores and assign them. Everything is stored locally in your browser.
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="secondary" onClick={() => setData(makeDemoData())}>
                    Load demo data
                  </Button>
                  <Button
                    onClick={() => {
                      setTab('people')
                    }}
                  >
                    Add people
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

          {content}
        </main>
      </div>
    </div>
  )
}
