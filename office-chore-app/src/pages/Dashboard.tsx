import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import type { Chore, Person } from '../lib/types'
import { isDueToday, isOverdue, safeFormatDate } from '../lib/dates'
import { getPerson } from '../lib/mutate'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <div className="text-xs font-medium text-slate-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  )
}

export function Dashboard({ chores, people }: { chores: Chore[]; people: Person[] }) {
  const todo = chores.filter((c) => c.status === 'todo').length
  const inProgress = chores.filter((c) => c.status === 'in_progress').length
  const done = chores.filter((c) => c.status === 'done').length

  const overdue = chores.filter((c) => c.status !== 'done' && isOverdue(c.dueDate)).length
  const dueToday = chores.filter((c) => c.status !== 'done' && isDueToday(c.dueDate)).length

  const upcoming = chores
    .filter((c) => c.status !== 'done')
    .slice()
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 8)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="To do" value={todo} />
        <Stat label="In progress" value={inProgress} />
        <Stat label="Done" value={done} />
        <Stat label="Overdue" value={overdue} />
        <Stat label="Due today" value={dueToday} />
        <Stat label="People" value={people.filter((p) => p.isActive).length} />
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-slate-900">Upcoming work</div>
            <div className="mt-1 text-sm text-slate-600">
              A quick look at the next chores that aren’t done yet.
            </div>
          </div>
          <div className="text-xs text-slate-500">{chores.length} total chores</div>
        </div>

        <div className="mt-4 divide-y divide-slate-200">
          {upcoming.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-600">
              Nothing upcoming. Create a chore to get started.
            </div>
          ) : (
            upcoming.map((c) => {
              const person = getPerson(people, c.assigneeId)
              const overdueFlag = c.status !== 'done' && isOverdue(c.dueDate)
              const todayFlag = c.status !== 'done' && isDueToday(c.dueDate)
              return (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">{c.title}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span>Assignee: {person?.name ?? 'Unassigned'}</span>
                      <span>•</span>
                      <span>Due: {safeFormatDate(c.dueDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {overdueFlag ? <Badge tone="rose">Overdue</Badge> : null}
                    {todayFlag ? <Badge tone="amber">Today</Badge> : null}
                    <Badge tone="slate">{c.status.replace('_', ' ')}</Badge>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}

