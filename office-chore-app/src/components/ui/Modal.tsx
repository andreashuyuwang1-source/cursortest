import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  maxWidthClassName = 'max-w-2xl',
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
  maxWidthClassName?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={[
          'relative w-full rounded-2xl bg-white shadow-xl ring-1 ring-slate-200',
          maxWidthClassName,
        ].join(' ')}
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-base font-semibold text-slate-900">{title}</div>
          {description ? <div className="mt-1 text-sm text-slate-600">{description}</div> : null}
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

