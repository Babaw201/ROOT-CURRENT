import type {
  Alert,
  AlertLevel,
  AlertType,
  ConfidenceLevel,
  Plant,
  Recommendation,
  SensorReading,
  WateringEvent,
} from '../../types'
import { DAY_MS, HOUR_MS, hoursSince, linearSlope, toSlopePoints } from '../../utils/time'
import { RECOMMENDATION_CONFIG as CFG } from './config'

/**
 * Résultat interne d'un détecteur : la matière première d'une alerte ou
 * d'une recommandation, avant mise en forme finale.
 */
export interface Detection {
  type: AlertType
  level: AlertLevel
  title: string
  explanation: string
  recommendedAction: string
  triggeringData: Record<string, number | string>
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function sortedHistory(history: SensorReading[]): SensorReading[] {
  return [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

function latestOf(history: SensorReading[]): SensorReading | undefined {
  return history.length > 0 ? history[history.length - 1] : undefined
}

/** true si au moins une lecture de l'historique contient une mesure de profondeur `deep`. */
function hasDeepProbeData(history: SensorReading[]): boolean {
  return history.some((r) => r.moisture?.deep !== undefined)
}

// ---------------------------------------------------------------------------
// Détecteurs individuels — chacun est une fonction pure, testable isolément.
// ---------------------------------------------------------------------------

/**
 * Détecte un arrosage superficiel : hausse en surface après un arrosage,
 * mais la zone profonde ne suit pas, et l'écart persiste dans le temps.
 * Retourne toujours `null` si aucune sonde de profondeur n'existe : on ne
 * devine jamais une valeur de profondeur absente.
 */
export function detectShallowWatering(
  history: SensorReading[],
  wateringEvents: WateringEvent[],
  now: Date = new Date(),
): Detection | null {
  const readings = sortedHistory(history)
  if (!hasDeepProbeData(readings)) return null

  const cfg = CFG.shallowWatering
  const recentEvents = wateringEvents
    .filter((e) => hoursSince(e.timestamp, now) <= cfg.lookbackHours)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const wateringEvent = recentEvents[0]
  if (!wateringEvent) return null

  const wateringTime = new Date(wateringEvent.timestamp).getTime()
  const baseline = [...readings].reverse().find((r) => new Date(r.timestamp).getTime() <= wateringTime)
  const afterWatering = readings.find((r) => new Date(r.timestamp).getTime() > wateringTime)
  const latest = latestOf(readings)
  if (!baseline || !afterWatering || !latest) return null

  const baselineSurface = baseline.moisture?.surface ?? afterWatering.moisture?.surface
  const baselineDeep = baseline.moisture?.deep ?? afterWatering.moisture?.deep
  const afterSurface = afterWatering.moisture?.surface
  const afterDeep = afterWatering.moisture?.deep
  const latestSurface = latest.moisture?.surface
  const latestDeep = latest.moisture?.deep
  if (
    baselineSurface === undefined ||
    baselineDeep === undefined ||
    afterSurface === undefined ||
    afterDeep === undefined ||
    latestSurface === undefined ||
    latestDeep === undefined
  ) {
    return null
  }

  const surfaceJump = afterSurface - baselineSurface
  const deepJump = afterDeep - baselineDeep
  const currentGap = latestSurface - latestDeep
  if (
    surfaceJump < cfg.minSurfaceJumpPoints ||
    deepJump > cfg.maxDeepJumpPoints ||
    currentGap < cfg.minSurfaceDeepGapPoints
  ) {
    return null
  }

  // L'écart doit persister depuis un minimum d'heures pour écarter un simple pic transitoire.
  const gapStart = readings.find(
    (r) =>
      new Date(r.timestamp).getTime() > wateringTime &&
      (r.moisture?.surface ?? 0) - (r.moisture?.deep ?? 0) >= cfg.minSurfaceDeepGapPoints,
  )
  if (!gapStart) return null
  const persistedHours = hoursSince(gapStart.timestamp, now)
  if (persistedHours < cfg.minPersistenceHours) return null

  return {
    type: 'shallow_watering',
    level: currentGap >= cfg.minSurfaceDeepGapPoints * 1.4 ? 'critical' : 'warning',
    title: 'Arrosage superficiel possible',
    explanation: `La surface est montée à ${round1(latestSurface)} % après l'arrosage, mais la zone profonde semble être restée autour de ${round1(latestDeep)} %. L'eau n'a probablement pas atteint les racines profondes.`,
    recommendedAction: "À vérifier : la prochaine fois, arrose plus longuement jusqu'à ce que l'eau ressorte par le fond du pot.",
    triggeringData: { surface: round1(latestSurface), deep: round1(latestDeep), gap: round1(currentGap) },
  }
}

/**
 * Détecte un excès d'humidité en profondeur qui persiste plusieurs jours.
 * Nécessite une sonde de profondeur ; sinon retourne `null`.
 */
export function detectOverwateringRisk(history: SensorReading[], now: Date = new Date()): Detection | null {
  const readings = sortedHistory(history)
  if (!hasDeepProbeData(readings)) return null

  const cfg = CFG.overwateringRisk
  const windowMs = cfg.minPersistenceDays * DAY_MS
  const inWindow = readings.filter(
    (r) => now.getTime() - new Date(r.timestamp).getTime() <= windowMs && r.moisture?.deep !== undefined,
  )
  if (inWindow.length < 2) return null

  const spanMs =
    new Date(inWindow[inWindow.length - 1].timestamp).getTime() - new Date(inWindow[0].timestamp).getTime()
  if (spanMs < windowMs * 0.7) return null

  const allHigh = inWindow.every((r) => (r.moisture?.deep ?? 0) >= cfg.deepMoistureHighThreshold)
  if (!allHigh) return null

  const latestDeep = inWindow[inWindow.length - 1].moisture?.deep ?? 0
  return {
    type: 'overwatering_risk',
    level: 'warning',
    title: 'Risque d\'excès d\'eau en profondeur',
    explanation: `La zone profonde reste autour de ${round1(latestDeep)} % depuis environ ${cfg.minPersistenceDays} jours. Le pot semble sécher plus lentement que d'habitude à cette profondeur.`,
    recommendedAction: 'Laisse le pot respirer avant le prochain arrosage, le temps que la profondeur redescende.',
    triggeringData: { deepMoisture: round1(latestDeep), persistenceDays: cfg.minPersistenceDays },
  }
}

/**
 * Estime dans combien de jours l'humidité de surface atteindra le seuil de
 * sécheresse, à partir de la tendance récente. Retourne `null` si la
 * tendance n'est pas décroissante ou si les données sont insuffisantes.
 */
export function estimateDaysUntilDry(
  history: SensorReading[],
  now: Date = new Date(),
  threshold: number = CFG.drySoon.lowMoistureThreshold,
): number | null {
  const readings = sortedHistory(history).filter(
    (r) => now.getTime() - new Date(r.timestamp).getTime() <= 5 * DAY_MS,
  )
  if (readings.length < CFG.drySoon.minTrendPoints) return null

  const points = toSlopePoints(readings, (r) => r.moisture?.surface)
  const slopePerHour = linearSlope(points)
  const latest = latestOf(readings)
  const currentSurface = latest?.moisture?.surface
  if (slopePerHour === null || slopePerHour >= 0 || currentSurface === undefined) return null

  const hoursUntilThreshold = (currentSurface - threshold) / -slopePerHour
  return round1(hoursUntilThreshold / 24)
}

/** Détecte un besoin d'arrosage prochain à partir de la tendance de séchage en surface. */
export function detectDrySoon(history: SensorReading[], now: Date = new Date()): Detection | null {
  const cfg = CFG.drySoon
  const readings = sortedHistory(history)
  const latest = latestOf(readings)
  const currentSurface = latest?.moisture?.surface
  if (currentSurface === undefined) return null

  const daysUntilDry = estimateDaysUntilDry(readings, now, cfg.lowMoistureThreshold)

  if (currentSurface <= cfg.lowMoistureThreshold) {
    return {
      type: 'dry_soon',
      level: 'warning',
      title: 'Arrosage bientôt nécessaire',
      explanation: `L'humidité de surface est déjà descendue à ${round1(currentSurface)} %, proche ou sous le seuil habituel de sécheresse pour ce pot.`,
      recommendedAction: 'Un arrosage est probablement à prévoir dans les prochains jours.',
      triggeringData: { surface: round1(currentSurface) },
    }
  }

  if (daysUntilDry !== null && daysUntilDry >= 0 && daysUntilDry <= cfg.maxForecastDays) {
    const level: AlertLevel = daysUntilDry <= 2 ? 'warning' : 'info'
    return {
      type: 'dry_soon',
      level,
      title: 'Arrosage bientôt nécessaire',
      explanation: `Le sol sèche progressivement (actuellement ${round1(currentSurface)} % en surface). Au rythme actuel, un arrosage sera probablement utile dans environ ${Math.max(1, Math.round(daysUntilDry))} jour${daysUntilDry >= 1.5 ? 's' : ''}.`,
      recommendedAction: 'Aucune action immédiate : garde un œil dessus dans les prochains jours.',
      triggeringData: { surface: round1(currentSurface), forecastDays: Math.round(daysUntilDry) },
    }
  }

  return null
}

export function detectLowBattery(latestBatteryLevel: number | undefined): Detection | null {
  if (latestBatteryLevel === undefined) return null
  const cfg = CFG.lowBattery
  if (latestBatteryLevel <= cfg.criticalLevel) {
    return {
      type: 'low_battery',
      level: 'critical',
      title: 'Batterie du capteur très faible',
      explanation: `Le capteur est à ${Math.round(latestBatteryLevel)} % de batterie. Il risque de se déconnecter bientôt.`,
      recommendedAction: 'Recharge le capteur dès que possible.',
      triggeringData: { battery: Math.round(latestBatteryLevel) },
    }
  }
  if (latestBatteryLevel <= cfg.warningLevel) {
    return {
      type: 'low_battery',
      level: 'warning',
      title: 'Batterie du capteur faible',
      explanation: `Le capteur est à ${Math.round(latestBatteryLevel)} % de batterie.`,
      recommendedAction: 'Prévois de recharger le capteur cette semaine.',
      triggeringData: { battery: Math.round(latestBatteryLevel) },
    }
  }
  return null
}

export function detectLowLight(history: SensorReading[], now: Date = new Date()): Detection | null {
  const cfg = CFG.lowLight
  const windowMs = cfg.minConsecutiveDays * DAY_MS
  const readings = sortedHistory(history).filter(
    (r) => now.getTime() - new Date(r.timestamp).getTime() <= windowMs && r.light?.dli !== undefined,
  )
  if (readings.length < 2) return null
  const spanMs = new Date(readings[readings.length - 1].timestamp).getTime() - new Date(readings[0].timestamp).getTime()
  if (spanMs < windowMs * 0.6) return null

  const avgDli = readings.reduce((sum, r) => sum + (r.light?.dli ?? 0), 0) / readings.length
  if (avgDli >= cfg.dliWarningThreshold) return null

  return {
    type: 'low_light',
    level: 'info',
    title: 'Manque de lumière depuis plusieurs jours',
    explanation: `La lumière reçue tourne autour de ${round1(avgDli)} DLI depuis ${cfg.minConsecutiveDays} jours, en dessous du niveau habituellement recommandé pour cette plante.`,
    recommendedAction: 'Rapproche légèrement la plante d\'une fenêtre si possible.',
    triggeringData: { averageDli: round1(avgDli) },
  }
}

export function detectHighTemperature(history: SensorReading[]): Detection | null {
  const latest = latestOf(sortedHistory(history))
  const temperature = latest?.temperature
  if (temperature === undefined || temperature <= CFG.temperature.highThreshold) return null
  return {
    type: 'high_temperature',
    level: 'warning',
    title: 'Température ambiante élevée',
    explanation: `La température autour de la plante est à ${round1(temperature)} °C, au-dessus du seuil habituellement confortable.`,
    recommendedAction: 'Éloigne la plante d\'une source de chaleur directe si possible.',
    triggeringData: { temperature: round1(temperature) },
  }
}

export function detectLowTemperature(history: SensorReading[]): Detection | null {
  const latest = latestOf(sortedHistory(history))
  const temperature = latest?.temperature
  if (temperature === undefined || temperature >= CFG.temperature.lowThreshold) return null
  return {
    type: 'low_temperature',
    level: 'warning',
    title: 'Température ambiante basse',
    explanation: `La température autour de la plante est à ${round1(temperature)} °C, en dessous du seuil habituellement confortable.`,
    recommendedAction: 'Vérifie qu\'elle n\'est pas placée près d\'une fenêtre froide ou d\'un courant d\'air.',
    triggeringData: { temperature: round1(temperature) },
  }
}

export function detectSensorOffline(lastSyncIso: string | undefined, now: Date = new Date()): Detection | null {
  if (!lastSyncIso) return null
  const hoursOffline = hoursSince(lastSyncIso, now)
  if (hoursOffline < CFG.sensorOffline.offlineAfterHours) return null
  return {
    type: 'sensor_offline',
    level: hoursOffline > 24 ? 'critical' : 'warning',
    title: 'Capteur hors ligne',
    explanation: `Aucune donnée reçue depuis environ ${Math.round(hoursOffline)} h.`,
    recommendedAction: 'Vérifie que le capteur est à portée du hub et qu\'il a encore de la batterie.',
    triggeringData: { hoursOffline: Math.round(hoursOffline) },
  }
}

/**
 * Compare le rythme de séchage récent à un rythme de référence pour repérer
 * un séchage anormalement rapide ou lent. Alimente aussi le bloc
 * « Ce que PlantMind apprend » sur l'accueil.
 */
export function detectUnusualDrying(history: SensorReading[], now: Date = new Date()): Detection | null {
  const cfg = CFG.unusualDrying
  const readings = sortedHistory(history)
  const windowMs = cfg.windowDays * DAY_MS
  const recentWindow = readings.filter((r) => now.getTime() - new Date(r.timestamp).getTime() <= windowMs)
  const baselineWindow = readings.filter((r) => {
    const age = now.getTime() - new Date(r.timestamp).getTime()
    return age > windowMs && age <= windowMs * 2
  })
  if (recentWindow.length < 3 || baselineWindow.length < 3) return null

  const recentSlope = linearSlope(toSlopePoints(recentWindow, (r) => r.moisture?.surface))
  const baselineSlope = linearSlope(toSlopePoints(baselineWindow, (r) => r.moisture?.surface))
  if (recentSlope === null || baselineSlope === null) return null

  const recentDryingRate = -recentSlope
  const baselineDryingRate = -baselineSlope
  if (baselineDryingRate <= 0.01) return null

  const ratio = recentDryingRate / baselineDryingRate
  if (ratio >= cfg.fasterRatio) {
    const percentFaster = Math.round((ratio - 1) * 100)
    return {
      type: 'unusual_drying',
      level: 'info',
      title: 'Séchage anormalement rapide',
      explanation: `Cette plante sèche environ ${percentFaster} % plus vite que la semaine dernière.`,
      recommendedAction: 'À surveiller : la fréquence d\'arrosage habituelle pourrait ne plus suffire.',
      triggeringData: { ratio: round1(ratio) },
    }
  }
  if (ratio <= cfg.slowerRatio) {
    const percentSlower = Math.round((1 - ratio) * 100)
    return {
      type: 'unusual_drying',
      level: 'info',
      title: 'Séchage anormalement lent',
      explanation: `Cette plante sèche environ ${percentSlower} % plus lentement que la semaine dernière. Aucun changement d'arrosage n'est nécessaire.`,
      recommendedAction: 'Aucune action nécessaire pour le moment.',
      triggeringData: { ratio: round1(ratio) },
    }
  }
  return null
}

/**
 * Détecte un écoulement inhabituel : l'eau semble traverser le pot sans
 * être absorbée (chute rapide en surface juste après l'arrosage, sans
 * réponse en profondeur). Heuristique volontairement simple et expérimentale.
 */
export function detectUnusualDrainage(
  history: SensorReading[],
  wateringEvents: WateringEvent[],
  now: Date = new Date(),
): Detection | null {
  const cfg = CFG.unusualDrainage
  const readings = sortedHistory(history)
  const recentEvent = [...wateringEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .find((e) => hoursSince(e.timestamp, now) <= cfg.withinHoursOfWatering + 24)
  if (!recentEvent) return null

  const wateringTime = new Date(recentEvent.timestamp).getTime()
  const windowEnd = wateringTime + cfg.withinHoursOfWatering * HOUR_MS
  const windowReadings = readings.filter((r) => {
    const t = new Date(r.timestamp).getTime()
    return t >= wateringTime && t <= windowEnd
  })
  if (windowReadings.length < 2) return null

  const surfaceValues = windowReadings.map((r) => r.moisture?.surface).filter((v): v is number => v !== undefined)
  const deepValues = windowReadings.map((r) => r.moisture?.deep).filter((v): v is number => v !== undefined)
  if (surfaceValues.length < 2) return null

  const peakSurface = Math.max(...surfaceValues)
  const finalSurface = surfaceValues[surfaceValues.length - 1]
  const drop = peakSurface - finalSurface
  const deepMoved = deepValues.length >= 2 ? Math.max(...deepValues) - Math.min(...deepValues) : 0

  if (drop < cfg.minSurfaceDropPoints || deepMoved > CFG.shallowWatering.maxDeepJumpPoints) return null

  return {
    type: 'unusual_drainage',
    level: 'info',
    title: 'Écoulement inhabituel après arrosage',
    explanation: `L'humidité de surface est redescendue rapidement après l'arrosage (${round1(drop)} points en quelques heures) sans hausse en profondeur : l'eau semble s'être écoulée sans être absorbée.`,
    recommendedAction: 'À vérifier : le substrat ou le drainage du pot pourrait mériter un coup d\'œil.',
    triggeringData: { surfaceDrop: round1(drop) },
  }
}

// ---------------------------------------------------------------------------
// Orchestration : une recommandation principale + une liste d'alertes.
// ---------------------------------------------------------------------------

function confidenceFromHistoryLength(historyLength: number): ConfidenceLevel {
  if (historyLength >= 20) return 'élevée'
  if (historyLength >= 5) return 'moyenne'
  return 'faible'
}

/**
 * Calcule LA recommandation à mettre en avant pour une plante : une seule
 * action, choisie par ordre de priorité parmi toutes les détections actives.
 */
export function computeRecommendation(plant: Plant, now: Date = new Date()): Recommendation {
  const { history, wateringEvents } = plant
  const confidence = confidenceFromHistoryLength(history.length)
  const generatedAt = now.toISOString()

  const offline = detectSensorOffline(plant.latestReading?.timestamp, now)
  if (offline) {
    return { action: 'Vérifie le capteur', explanation: offline.explanation, confidence, status: 'offline', generatedAt }
  }

  const overwatering = detectOverwateringRisk(history, now)
  if (overwatering) {
    return {
      action: "N'arrose pas aujourd'hui",
      explanation: overwatering.explanation,
      confidence,
      status: 'action',
      generatedAt,
    }
  }

  const shallow = detectShallowWatering(history, wateringEvents, now)
  if (shallow) {
    return {
      action: 'Arrosage superficiel possible',
      explanation: shallow.explanation,
      confidence,
      status: 'action',
      generatedAt,
    }
  }

  const drySoon = detectDrySoon(history, now)
  if (drySoon) {
    return {
      action: drySoon.title,
      explanation: drySoon.explanation,
      confidence,
      status: drySoon.level === 'warning' ? 'action' : 'watch',
      generatedAt,
    }
  }

  const battery = detectLowBattery(plant.latestReading?.battery?.level)
  if (battery) {
    return {
      action: battery.title,
      explanation: battery.explanation,
      confidence,
      status: battery.level === 'critical' ? 'action' : 'watch',
      generatedAt,
    }
  }

  const light = detectLowLight(history, now)
  if (light) {
    return { action: 'Rapproche-la d\'une fenêtre', explanation: light.explanation, confidence, status: 'watch', generatedAt }
  }

  const highTemp = detectHighTemperature(history)
  const lowTemp = detectLowTemperature(history)
  const tempIssue = highTemp ?? lowTemp
  if (tempIssue) {
    return { action: tempIssue.title, explanation: tempIssue.explanation, confidence, status: 'watch', generatedAt }
  }

  const drying = detectUnusualDrying(history, now)
  if (drying) {
    return {
      action: "Rien à faire aujourd'hui",
      explanation: drying.explanation,
      confidence,
      status: 'good',
      generatedAt,
    }
  }

  return {
    action: "Rien à faire aujourd'hui",
    explanation: 'Le sol sèche normalement et aucune anomalie n\'est détectée pour le moment.',
    confidence,
    status: 'good',
    generatedAt,
  }
}

/** Identifiant stable : une seule alerte active par type et par plante. */
function makeAlertId(plantId: string, type: AlertType): string {
  return `${plantId}:${type}`
}

/**
 * Génère toutes les alertes actives pour une plante (pas seulement la
 * recommandation principale). Une seule alerte par type et par plante.
 */
export function generateAlertsForPlant(plant: Plant, now: Date = new Date()): Alert[] {
  const { history, wateringEvents } = plant
  const detections: (Detection | null)[] = [
    detectSensorOffline(plant.latestReading?.timestamp, now),
    detectOverwateringRisk(history, now),
    detectShallowWatering(history, wateringEvents, now),
    detectDrySoon(history, now),
    detectLowBattery(plant.latestReading?.battery?.level),
    detectLowLight(history, now),
    detectHighTemperature(history),
    detectLowTemperature(history),
    detectUnusualDrying(history, now),
    detectUnusualDrainage(history, wateringEvents, now),
  ]

  return detections
    .filter((d): d is Detection => d !== null)
    .map((d) => ({
      id: makeAlertId(plant.id, d.type),
      plantId: plant.id,
      type: d.type,
      level: d.level,
      title: d.title,
      explanation: d.explanation,
      date: now.toISOString(),
      read: false,
      recommendedAction: d.recommendedAction,
      triggeringData: d.triggeringData,
    }))
}
