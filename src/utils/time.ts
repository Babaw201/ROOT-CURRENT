import type { HistoryRange, SensorReading } from '../types'

export const HOUR_MS = 60 * 60 * 1000
export const DAY_MS = 24 * HOUR_MS

const RANGE_TO_MS: Record<HistoryRange, number> = {
  '24h': HOUR_MS * 24,
  '7j': DAY_MS * 7,
  '30j': DAY_MS * 30,
}

/** Filtre un historique (potentiellement à intervalles irréguliers) sur une fenêtre glissante. */
export function filterReadingsByRange(
  history: SensorReading[],
  range: HistoryRange,
  now: Date = new Date(),
): SensorReading[] {
  const cutoff = now.getTime() - RANGE_TO_MS[range]
  return history.filter((reading) => new Date(reading.timestamp).getTime() >= cutoff)
}

export function hoursSince(iso: string, now: Date = new Date()): number {
  return (now.getTime() - new Date(iso).getTime()) / HOUR_MS
}

export function daysSince(iso: string, now: Date = new Date()): number {
  return (now.getTime() - new Date(iso).getTime()) / DAY_MS
}

/**
 * Pente d'une régression linéaire simple (moindres carrés) sur une série de points.
 * Retourne `null` si la série est trop courte pour être significative.
 * Utilisé pour estimer une tendance de séchage sans complexité inutile.
 */
export function linearSlope(points: { x: number; y: number }[]): number | null {
  if (points.length < 3) return null
  const n = points.length
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n
  let numerator = 0
  let denominator = 0
  for (const p of points) {
    numerator += (p.x - meanX) * (p.y - meanY)
    denominator += (p.x - meanX) ** 2
  }
  if (denominator === 0) return 0
  return numerator / denominator
}

/** Transforme un historique en points (heures écoulées, valeur) exploitables par `linearSlope`. */
export function toSlopePoints(
  history: SensorReading[],
  selectValue: (reading: SensorReading) => number | undefined,
): { x: number; y: number }[] {
  if (history.length === 0) return []
  const t0 = new Date(history[0].timestamp).getTime()
  const points: { x: number; y: number }[] = []
  for (const reading of history) {
    const value = selectValue(reading)
    if (value === undefined) continue
    points.push({ x: (new Date(reading.timestamp).getTime() - t0) / HOUR_MS, y: value })
  }
  return points
}
