import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-stone-300 bg-white/60 p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eef4e8] text-[#426238]">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold text-stone-800">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-stone-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function LoadingState({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-3 rounded-[28px] border border-stone-200 bg-white p-10 text-sm text-stone-500"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-[#426238]"
        aria-hidden="true"
      />
      {label}
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="rounded-[28px] border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700"
      role="alert"
    >
      {message}
    </div>
  )
}
