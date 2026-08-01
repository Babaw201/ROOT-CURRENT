/** Formatage de dates, pourcentages et unités, toujours en français. */

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * Convertit un timestamp ISO en formulation relative française.
 * ("à l'instant", "il y a 4 min", "il y a 3 h", "il y a 2 j")
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime()
  const diff = now.getTime() - then
  if (Number.isNaN(then)) return 'inconnu'
  if (diff < 45_000) return 'à l’instant'
  if (diff < HOUR) return `il y a ${Math.max(1, Math.round(diff / MINUTE))} min`
  if (diff < DAY) return `il y a ${Math.round(diff / HOUR)} h`
  const days = Math.round(diff / DAY)
  return `il y a ${days} j`
}

export function formatPercent(value: number | undefined): string {
  return value === undefined ? '—' : `${Math.round(value)} %`
}

export function formatTemperature(value: number | undefined): string {
  return value === undefined ? '—' : `${value.toFixed(1).replace('.', ',')} °C`
}

export function formatDLI(value: number | undefined): string {
  return value === undefined ? '—' : `${value.toFixed(1).replace('.', ',')} DLI`
}

export function formatSignal(dBm: number | undefined): string {
  if (dBm === undefined) return '—'
  if (dBm >= -60) return 'Excellent'
  if (dBm >= -75) return 'Bon'
  return 'Faible'
}

/** Étiquette d'axe adaptée à la plage temporelle affichée. */
export function formatAxisTick(iso: string, range: '24h' | '7j' | '30j'): string {
  const date = new Date(iso)
  if (range === '24h') {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  if (range === '7j') {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' })
  }
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export function formatFullDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
