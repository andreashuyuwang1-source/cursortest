import type { PropsWithChildren } from 'react'

export function Card({ children }: PropsWithChildren) {
  return <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">{children}</div>
}

