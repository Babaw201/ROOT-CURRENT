import type { ReactNode } from 'react'

export function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-3xl border border-stone-200/80 bg-white p-4 shadow-sm">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#eef4e8] text-[#426238]">
        {icon}
      </div>
      <div className="text-sm text-stone-500">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight text-stone-900">{value}</div>
      <div className="mt-1 text-xs leading-5 text-stone-400">{hint}</div>
    </div>
  )
}

export function MetricMini({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-3">
      <div className="flex items-center gap-2 text-xs text-stone-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-stone-800">{value}</div>
    </div>
  )
}

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-stone-400">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-stone-800">{value}</div>
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">{subtitle}</p>
      </div>
      {action}
    </header>
  )
}
