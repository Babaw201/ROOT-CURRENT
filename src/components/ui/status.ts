import type { AlertLevel, PlantStatus } from '../../types'

/** Les 4 états possibles d'une plante — jamais un score abstrait (voir cahier des charges §11). */
export const STATUS_LABELS: Record<PlantStatus, string> = {
  good: 'Bien',
  watch: 'À surveiller',
  action: 'Action nécessaire',
  offline: 'Hors ligne',
}

export const STATUS_STYLES: Record<PlantStatus, string> = {
  good: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  watch: 'bg-amber-50 text-amber-700 border-amber-100',
  action: 'bg-rose-50 text-rose-700 border-rose-100',
  offline: 'bg-stone-100 text-stone-500 border-stone-200',
}

export const ALERT_LEVEL_LABELS: Record<AlertLevel, string> = {
  info: 'Info',
  warning: 'Avertissement',
  critical: 'Critique',
}

export const ALERT_LEVEL_STYLES: Record<AlertLevel, string> = {
  info: 'bg-sky-50 text-sky-700 border-sky-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  critical: 'bg-rose-50 text-rose-700 border-rose-100',
}
