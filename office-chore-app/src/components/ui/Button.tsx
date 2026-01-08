import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'
  const sizes = size === 'sm' ? 'h-9 px-3 text-sm' : 'h-10 px-4 text-sm'
  const variants: Record<Variant, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  }

  return (
    <button className={[base, sizes, variants[variant], className].join(' ')} {...rest}>
      {children}
    </button>
  )
}

