/**
 * Données simulées : 8 scénarios réalistes couvrant toutes les pages de
 * l'application. Ce fichier ne contient AUCUNE règle de décision — il ne
 * produit que des mesures brutes. Le statut et la recommandation de chaque
 * plante sont calculés ensuite par `src/domain/recommendations`, jamais
 * codés en dur ici.
 *
 * Tous les capteurs et données de ce fichier sont fictifs : aucun hardware
 * réel n'existe encore (voir docs/hardware-integration.md).
 */
import type { Hub, Plant, ProbeDepth, SensorReading, WateringEvent, WindowPosition } from '../types'
import { DAY_MS, HOUR_MS } from '../utils/time'

export type PlantSeed = Omit<Plant, 'status' | 'recommendation' | 'latestReading'>

interface DepthConfig {
  postWater: number
  dryRatePerDay: number
  floor: number
}

interface HistoryOptions {
  now: Date
  days: number
  wateringDaysAgo: number[]
  surface: DepthConfig
  middle?: DepthConfig
  deep?: DepthConfig
  battery: { current: number; drainPerDay: number }
  light: { dayDli: number }
  temperature: { base: number }
  ambientHumidity: { base: number }
  signalStrength?: number
  skipAutoRecentTail?: boolean
  reserveRecentHours?: number
  silentForLastHours?: number
}

function samplesForDay(dayIndex: number, isWateringDay: boolean): number {
  if (isWateringDay) return 8
  return dayIndex % 3 === 0 ? 3 : 6
}

function decayedValue(hoursSinceWatering: number, config: DepthConfig): number {
  if (!Number.isFinite(hoursSinceWatering)) return config.floor + (config.postWater - config.floor) * 0.4
  const value = config.postWater - config.dryRatePerDay * (hoursSinceWatering / 24)
  return Math.max(config.floor, Math.round(value * 10) / 10)
}

function dayVariance(dayBucket: number): number {
  return 0.85 + 0.3 * (((dayBucket * 53) % 100) / 100)
}

function readingAt(timestampMs: number, opts: HistoryOptions, wateringTimestamps: number[]): SensorReading {
  const priorWaterings = wateringTimestamps.filter((t) => t <= timestampMs)
  const hoursSinceWatering =
    priorWaterings.length > 0 ? (timestampMs - Math.max(...priorWaterings)) / HOUR_MS : Infinity

  const surface = decayedValue(hoursSinceWatering, opts.surface)
  const middle = opts.middle ? decayedValue(hoursSinceWatering, opts.middle) : undefined
  const deep = opts.deep ? decayedValue(hoursSinceWatering, opts.deep) : undefined

  const hoursAgo = (opts.now.getTime() - timestampMs) / HOUR_MS
  const dayBucket = Math.floor(hoursAgo / 24)
  const dli = Math.max(0.1, opts.light.dayDli * dayVariance(dayBucket))

  // `current` est le niveau à « maintenant » ; on remonte le temps en additionnant
  // la décharge, donc les points plus anciens affichent une batterie plus pleine.
  const battery = Math.max(4, Math.min(100, opts.battery.current + opts.battery.drainPerDay * (hoursAgo / 24)))

  return {
    sensorId: 'sensor-demo',
    plantId: 'placeholder',
    timestamp: new Date(timestampMs).toISOString(),
    moisture: { surface, middle, deep },
    light: { dli: Math.round(dli * 10) / 10, ppfd: Math.round(dli * 28) },
    temperature: Math.round((opts.temperature.base + Math.sin(hoursAgo / 11) * 0.6) * 10) / 10,
    ambientHumidity: Math.round(opts.ambientHumidity.base + Math.cos(hoursAgo / 13) * 3),
    battery: { level: Math.round(battery) },
    signalStrength: opts.signalStrength ?? -55,
  }
}

const AUTO_RECENT_TAIL_HOURS_AGO = [18, 12, 7, 4, 1.5, 0.1]

function buildHistory(opts: HistoryOptions): SensorReading[] {
  const { now, days, wateringDaysAgo } = opts
  const wateringTimestamps = wateringDaysAgo.map((d) => now.getTime() - d * DAY_MS)
  const readings: SensorReading[] = []

  for (let d = days; d >= 1; d--) {
    const dayStartMs = now.getTime() - d * DAY_MS
    const isWateringDay = wateringDaysAgo.includes(d)
    const count = samplesForDay(d, isWateringDay)
    for (let i = 0; i < count; i++) {
      const fraction = (i + 0.5) / count
      const jitterMinutes = ((d * 31 + i * 17) % 47) - 23
      const timestampMs = dayStartMs + fraction * DAY_MS + jitterMinutes * 60_000
      readings.push(readingAt(timestampMs, opts, wateringTimestamps))
    }
  }

  if (!opts.skipAutoRecentTail) {
    for (const hoursAgo of AUTO_RECENT_TAIL_HOURS_AGO) {
      readings.push(readingAt(now.getTime() - hoursAgo * HOUR_MS, opts, wateringTimestamps))
    }
  }

  let result = readings
  if (opts.reserveRecentHours) {
    const cutoff = opts.reserveRecentHours
    result = result.filter((r) => (now.getTime() - new Date(r.timestamp).getTime()) / HOUR_MS >= cutoff)
  }
  if (opts.silentForLastHours) {
    const cutoff = opts.silentForLastHours
    result = result.filter((r) => (now.getTime() - new Date(r.timestamp).getTime()) / HOUR_MS >= cutoff)
  }

  return result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

function buildWateringEvents(
  plantId: string,
  now: Date,
  daysAgoList: number[],
  kinds?: Record<number, WateringEvent['kind']>,
): WateringEvent[] {
  return daysAgoList.map((d, index) => ({
    id: `${plantId}-watering-${index}`,
    plantId,
    timestamp: new Date(now.getTime() - d * DAY_MS).toISOString(),
    kind: kinds?.[d] ?? 'normal',
  }))
}

function stampPlantId(history: SensorReading[], plantId: string): SensorReading[] {
  return history.map((r) => ({ ...r, plantId }))
}

function point(
  hoursAgo: number,
  now: Date,
  values: {
    surface?: number
    middle?: number
    deep?: number
    battery: number
    dli: number
    temperature: number
    ambientHumidity: number
  },
): SensorReading {
  return {
    sensorId: 'sensor-demo',
    plantId: 'placeholder',
    timestamp: new Date(now.getTime() - hoursAgo * HOUR_MS).toISOString(),
    moisture: { surface: values.surface, middle: values.middle, deep: values.deep },
    light: { dli: values.dli, ppfd: Math.round(values.dli * 28) },
    temperature: values.temperature,
    ambientHumidity: values.ambientHumidity,
    battery: { level: values.battery },
    signalStrength: -57,
  }
}

const HISTORY_DAYS = 30

function seedHealthy(now: Date): PlantSeed {
  const id = 'mona'
  const bulkWaterings = [29, 20]
  const history = stampPlantId(
    buildHistory({
      now,
      days: HISTORY_DAYS,
      wateringDaysAgo: bulkWaterings,
      surface: { postWater: 78, dryRatePerDay: 7.5, floor: 24 },
      deep: { postWater: 62, dryRatePerDay: 4, floor: 26 },
      battery: { current: 96, drainPerDay: 0.3 },
      light: { dayDli: 7.6 },
      temperature: { base: 22.3 },
      ambientHumidity: { base: 56 },
      skipAutoRecentTail: true,
      reserveRecentHours: 14 * 24 + 1,
    }),
    id,
  )

  const commonAmbient = { dli: 7.6, temperature: 22.3, ambientHumidity: 56 }
  const narrative: SensorReading[] = [
    point(14 * 24, now, { surface: 64, deep: 48, battery: 92, ...commonAmbient }),
    point(12 * 24, now, { surface: 62.3, deep: 45.6, battery: 92, ...commonAmbient }),
    point(10 * 24, now, { surface: 60.6, deep: 43.2, battery: 93, ...commonAmbient }),
    point(6 * 24, now, { surface: 57.4, deep: 41.8, battery: 93, ...commonAmbient }),
    point(3 * 24, now, { surface: 55.5, deep: 41, battery: 94, ...commonAmbient }),
    point(0.1, now, { surface: 53.6, deep: 40.3, battery: 95, ...commonAmbient }),
  ].map((r) => ({ ...r, plantId: id, sensorId: `sensor-${id}` }))

  const fullHistory = [...history, ...narrative].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )

  return {
    id,
    nickname: 'Mona',
    species: 'Monstera deliciosa',
    room: 'Salon',
    potSize: 'Moyen',
    sensorSize: 'M',
    probeDepths: ['surface', 'deep'] as ProbeDepth[],
    windowPosition: 'proche' as WindowPosition,
    history: fullHistory,
    wateringEvents: buildWateringEvents(id, now, bulkWaterings),
    createdAt: new Date(now.getTime() - 60 * DAY_MS).toISOString(),
    usesRealSensor: false,
  }
}

function seedDrySoon(now: Date): PlantSeed {
  const id = 'rio'
  const wateringDaysAgo = [24, 15, 6]
  const history = stampPlantId(
    buildHistory({
      now,
      days: HISTORY_DAYS,
      wateringDaysAgo,
      surface: { postWater: 62, dryRatePerDay: 3.4, floor: 16 },
      battery: { current: 80, drainPerDay: 0.4 },
      light: { dayDli: 6.2 },
      temperature: { base: 23.1 },
      ambientHumidity: { base: 49 },
    }),
    id,
  )
  return {
    id,
    nickname: 'Rio',
    species: 'Epipremnum aureum',
    room: 'Bureau',
    potSize: 'Petit',
    sensorSize: 'S',
    probeDepths: ['surface'] as ProbeDepth[],
    windowPosition: 'eloignee' as WindowPosition,
    history,
    wateringEvents: buildWateringEvents(id, now, wateringDaysAgo),
    createdAt: new Date(now.getTime() - 45 * DAY_MS).toISOString(),
    usesRealSensor: false,
  }
}

function seedShallowWatering(now: Date): PlantSeed {
  const id = 'luna'
  const bulkWaterings = [24, 17, 10]
  const history = stampPlantId(
    buildHistory({
      now,
      days: HISTORY_DAYS,
      wateringDaysAgo: bulkWaterings,
      surface: { postWater: 74, dryRatePerDay: 5, floor: 24 },
      middle: { postWater: 58, dryRatePerDay: 3.6, floor: 26 },
      deep: { postWater: 50, dryRatePerDay: 2.4, floor: 27 },
      battery: { current: 70, drainPerDay: 0.35 },
      light: { dayDli: 4.6 },
      temperature: { base: 22.8 },
      ambientHumidity: { base: 52 },
      skipAutoRecentTail: true,
      reserveRecentHours: 27,
    }),
    id,
  )

  const common = { dli: 4.6, temperature: 22.7, ambientHumidity: 52 }
  const narrative = [
    point(25.5, now, { surface: 83, middle: 40, deep: 31, battery: 67, ...common }),
    point(18, now, { surface: 81, middle: 39, deep: 31, battery: 67, ...common }),
    point(8, now, { surface: 80, middle: 41, deep: 31, battery: 66, ...common }),
    point(0.1, now, { surface: 79, middle: 46, deep: 31, battery: 66, ...common }),
  ].map((r) => ({ ...r, plantId: id, sensorId: `sensor-${id}` }))

  const fullHistory = [...history, ...narrative].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )

  return {
    id,
    nickname: 'Luna',
    species: 'Calathea orbifolia',
    room: 'Chambre',
    potSize: 'Grand',
    sensorSize: 'L',
    probeDepths: ['surface', 'middle', 'deep'] as ProbeDepth[],
    windowPosition: 'eloignee' as WindowPosition,
    history: fullHistory,
    wateringEvents: buildWateringEvents(id, now, [...bulkWaterings, 26 / 24], { [26 / 24]: 'shallow_suspected' }),
    createdAt: new Date(now.getTime() - 70 * DAY_MS).toISOString(),
    usesRealSensor: false,
  }
}

function seedOverwateringRisk(now: Date): PlantSeed {
  const id = 'atlas'
  const wateringDaysAgo = [26, 19, 8, 4]
  const history = stampPlantId(
    buildHistory({
      now,
      days: HISTORY_DAYS,
      wateringDaysAgo,
      surface: { postWater: 70, dryRatePerDay: 5.5, floor: 30 },
      middle: { postWater: 64, dryRatePerDay: 2.2, floor: 40 },
      deep: { postWater: 66, dryRatePerDay: 1.1, floor: 45 },
      battery: { current: 84, drainPerDay: 0.3 },
      light: { dayDli: 5.3 },
      temperature: { base: 22.4 },
      ambientHumidity: { base: 57 },
    }),
    id,
  )
  const forced = history.map((r) => {
    const daysAgo = (now.getTime() - new Date(r.timestamp).getTime()) / DAY_MS
    if (daysAgo <= 4 && r.moisture?.deep !== undefined) {
      return { ...r, moisture: { ...r.moisture, deep: 58 + Math.round(Math.sin(daysAgo * 3) * 2) } }
    }
    return r
  })

  return {
    id,
    nickname: 'Atlas',
    species: 'Ficus elastica',
    room: 'Salon',
    potSize: 'Grand',
    sensorSize: 'L',
    probeDepths: ['surface', 'middle', 'deep'] as ProbeDepth[],
    windowPosition: 'contre_la_fenetre' as WindowPosition,
    history: forced,
    wateringEvents: buildWateringEvents(id, now, wateringDaysAgo),
    createdAt: new Date(now.getTime() - 80 * DAY_MS).toISOString(),
    usesRealSensor: false,
  }
}

function seedLowBattery(now: Date): PlantSeed {
  const id = 'iris'
  const wateringDaysAgo = [24, 12, 2]
  const history = stampPlantId(
    buildHistory({
      now,
      days: HISTORY_DAYS,
      wateringDaysAgo,
      surface: { postWater: 60, dryRatePerDay: 3.2, floor: 22 },
      battery: { current: 13, drainPerDay: 1.35 },
      light: { dayDli: 5.8 },
      temperature: { base: 21.9 },
      ambientHumidity: { base: 51 },
    }),
    id,
  )
  return {
    id,
    nickname: 'Iris',
    species: 'Sansevieria trifasciata',
    room: 'Entrée',
    potSize: 'Petit',
    sensorSize: 'S',
    probeDepths: ['surface'] as ProbeDepth[],
    windowPosition: 'proche' as WindowPosition,
    history,
    wateringEvents: buildWateringEvents(id, now, wateringDaysAgo),
    createdAt: new Date(now.getTime() - 120 * DAY_MS).toISOString(),
    usesRealSensor: false,
  }
}

function seedSensorOffline(now: Date): PlantSeed {
  const id = 'basile'
  const wateringDaysAgo = [22, 12]
  const history = stampPlantId(
    buildHistory({
      now,
      days: HISTORY_DAYS,
      wateringDaysAgo,
      surface: { postWater: 68, dryRatePerDay: 6.5, floor: 20 },
      battery: { current: 55, drainPerDay: 0.5 },
      light: { dayDli: 6.2 },
      temperature: { base: 23.4 },
      ambientHumidity: { base: 48 },
      silentForLastHours: 10,
    }),
    id,
  )
  return {
    id,
    nickname: 'Basile',
    species: 'Ocimum basilicum',
    room: 'Cuisine',
    potSize: 'Petit',
    sensorSize: 'S',
    probeDepths: ['surface'] as ProbeDepth[],
    windowPosition: 'proche' as WindowPosition,
    history,
    wateringEvents: buildWateringEvents(id, now, wateringDaysAgo),
    createdAt: new Date(now.getTime() - 35 * DAY_MS).toISOString(),
    usesRealSensor: false,
  }
}

function seedLowLight(now: Date): PlantSeed {
  const id = 'noa'
  const wateringDaysAgo = [25, 17, 9, 2]
  const history = stampPlantId(
    buildHistory({
      now,
      days: HISTORY_DAYS,
      wateringDaysAgo,
      surface: { postWater: 64, dryRatePerDay: 3.4, floor: 26 },
      deep: { postWater: 55, dryRatePerDay: 1.8, floor: 30 },
      battery: { current: 88, drainPerDay: 0.25 },
      light: { dayDli: 1.9 },
      temperature: { base: 21.6 },
      ambientHumidity: { base: 54 },
    }),
    id,
  )
  return {
    id,
    nickname: 'Noa',
    species: 'Ficus lyrata',
    room: 'Bureau',
    potSize: 'Moyen',
    sensorSize: 'M',
    probeDepths: ['surface', 'deep'] as ProbeDepth[],
    windowPosition: 'aucune_fenetre' as WindowPosition,
    history,
    wateringEvents: buildWateringEvents(id, now, wateringDaysAgo),
    createdAt: new Date(now.getTime() - 50 * DAY_MS).toISOString(),
    usesRealSensor: false,
  }
}

function seedFastDrying(now: Date): PlantSeed {
  const id = 'suki'
  // Pas d'arrosage dans les 16 derniers jours : les fenêtres de comparaison
  // (0-7j et 7-14j) restent chacune sur une seule courbe de séchage continue.
  const wateringDaysAgo = [30, 16]
  const history = stampPlantId(
    buildHistory({
      now,
      days: HISTORY_DAYS,
      wateringDaysAgo,
      surface: { postWater: 70, dryRatePerDay: 2.2, floor: 26 },
      deep: { postWater: 58, dryRatePerDay: 1.6, floor: 30 },
      battery: { current: 91, drainPerDay: 0.3 },
      light: { dayDli: 6.4 },
      temperature: { base: 24.1 },
      ambientHumidity: { base: 45 },
    }),
    id,
  )
  const accelerated = history.map((r) => {
    const daysAgo = (now.getTime() - new Date(r.timestamp).getTime()) / DAY_MS
    if (daysAgo <= 7 && r.moisture?.surface !== undefined) {
      const extraDrop = (7 - daysAgo) * 1.6
      return { ...r, moisture: { ...r.moisture, surface: Math.max(24, r.moisture.surface - extraDrop) } }
    }
    return r
  })

  return {
    id,
    nickname: 'Suki',
    species: 'Maranta leuconeura',
    room: 'Chambre',
    potSize: 'Moyen',
    sensorSize: 'M',
    probeDepths: ['surface', 'deep'] as ProbeDepth[],
    windowPosition: 'proche' as WindowPosition,
    history: accelerated,
    wateringEvents: buildWateringEvents(id, now, wateringDaysAgo),
    createdAt: new Date(now.getTime() - 55 * DAY_MS).toISOString(),
    usesRealSensor: false,
  }
}

export function getSeedPlants(now: Date = new Date()): PlantSeed[] {
  return [
    seedHealthy(now),
    seedDrySoon(now),
    seedShallowWatering(now),
    seedOverwateringRisk(now),
    seedLowBattery(now),
    seedSensorOffline(now),
    seedLowLight(now),
    seedFastDrying(now),
  ]
}

export function getSeedHub(now: Date = new Date()): Hub {
  return {
    id: 'hub-1',
    name: 'Hub PlantMind',
    online: true,
    wifiQuality: 'excellent',
    ambientTemperature: 22.4,
    ambientHumidity: 56,
    connectedSensorIds: getSeedPlants(now)
      .filter((p) => p.id !== 'basile')
      .map((p) => `sensor-${p.id}`),
    lastSync: new Date(now.getTime() - 60 * 1000).toISOString(),
  }
}
