import type { PropsWithChildren, ReactNode } from 'react'

export function Field({
  label,
  hint,
  children,
}: PropsWithChildren<{ label: string; hint?: ReactNode }>) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <div className="text-sm font-medium text-slate-900">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      {children}
    </label>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  return (
    <input
      className={[
        'h-10 w-full rounded-lg bg-white px-3 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400',
        'focus:ring-2 focus:ring-indigo-500',
        className,
      ].join(' ')}
      {...rest}
    />
  )
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props
  return (
    <textarea
      className={[
        'min-h-24 w-full resize-y rounded-lg bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400',
        'focus:ring-2 focus:ring-indigo-500',
        className,
      ].join(' ')}
      {...rest}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', ...rest } = props
  return (
    <select
      className={[
        'h-10 w-full rounded-lg bg-white px-3 text-sm text-slate-900 ring-1 ring-slate-200',
        'focus:ring-2 focus:ring-indigo-500',
        className,
      ].join(' ')}
      {...rest}
    />
  )
}

export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-slate-200" />
      {label ? <div className="text-xs font-medium text-slate-500">{label}</div> : null}
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  )
}

