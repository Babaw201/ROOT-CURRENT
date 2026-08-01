import { AlertTriangle, CheckCircle2, Eye, WifiOff } from 'lucide-react'
import type { PlantStatus } from '../../types'
import { STATUS_LABELS, STATUS_STYLES } from './status'

const STATUS_ICONS = {
  good: CheckCircle2,
  watch: Eye,
  action: AlertTriangle,
  offline: WifiOff,
} as const

export function StatusBadge({ status, size = 'sm' }: { status: PlantStatus; size?: 'sm' | 'md' }) {
  const Icon = STATUS_ICONS[status]
  const sizeClasses = size === 'md' ? 'gap-1.5 px-3 py-1.5 text-sm' : 'gap-1 px-2 py-0.5 text-[11px]'
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${STATUS_STYLES[status]} ${sizeClasses}`}
    >
      <Icon size={size === 'md' ? 15 : 12} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  )
}
