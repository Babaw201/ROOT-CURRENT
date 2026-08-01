import {
  AlertTriangle,
  BatteryWarning,
  Droplets,
  Sun,
  Thermometer,
  Waves,
  WifiOff,
} from 'lucide-react'
import type { Alert, AlertType } from '../../types'
import { formatFullDateTime, formatRelativeTime } from '../../utils/format'
import { ALERT_LEVEL_LABELS, ALERT_LEVEL_STYLES } from './status'

const TYPE_ICONS: Record<AlertType, typeof Droplets> = {
  shallow_watering: Droplets,
  overwatering_risk: Waves,
  dry_soon: Droplets,
  low_light: Sun,
  high_temperature: Thermometer,
  low_temperature: Thermometer,
  low_battery: BatteryWarning,
  sensor_offline: WifiOff,
  unusual_drying: AlertTriangle,
  unusual_drainage: Waves,
}

export function AlertCard({
  alert,
  plantName,
  onMarkAsRead,
  onOpenPlant,
}: {
  alert: Alert
  plantName: string
  onMarkAsRead: (alertId: string) => void
  onOpenPlant?: () => void
}) {
  const Icon = TYPE_ICONS[alert.type]
  return (
    <div
      className={`rounded-[26px] border bg-white p-5 shadow-sm ${alert.read ? 'border-stone-200' : 'border-stone-300'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border ${ALERT_LEVEL_STYLES[alert.level]}`}>
          <Icon size={18} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${ALERT_LEVEL_STYLES[alert.level]}`}
            >
              {ALERT_LEVEL_LABELS[alert.level]}
            </span>
            {!alert.read && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#426238]" aria-label="Non lue" title="Non lue" />
            )}
          </div>
          <h3 className="mt-1.5 font-semibold text-stone-900">{alert.title}</h3>
          <button
            onClick={onOpenPlant}
            className="mt-0.5 rounded text-xs font-medium text-[#4b6845] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238]"
          >
            {plantName}
          </button>
          <p className="mt-2 text-sm leading-6 text-stone-600">{alert.explanation}</p>
          <div className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-500">{alert.recommendedAction}</div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-stone-400" title={formatFullDateTime(alert.date)}>
              {formatRelativeTime(alert.date)}
            </span>
            {!alert.read && (
              <button
                onClick={() => onMarkAsRead(alert.id)}
                className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-stone-300 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238]"
              >
                Marquer comme lue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
