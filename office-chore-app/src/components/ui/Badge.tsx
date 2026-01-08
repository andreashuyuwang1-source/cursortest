import type { PropsWithChildren } from 'react'

export function Badge({
  children,
  tone = 'slate',
}: PropsWithChildren<{ tone?: 'slate' | 'indigo' | 'amber' | 'emerald' | 'rose' }>) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-800 ring-slate-200',
    indigo: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
    amber: 'bg-amber-50 text-amber-900 ring-amber-200',
    emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    rose: 'bg-rose-50 text-rose-800 ring-rose-200',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

