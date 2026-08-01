import { describe, expect, it } from 'vitest'
import type { SensorReading, WateringEvent } from '../../types'
import { CAUTIOUS_WORDING } from './config'
import {
  detectDrySoon,
  detectLowBattery,
  detectOverwateringRisk,
  detectShallowWatering,
  estimateDaysUntilDry,
} from './engine'

const BASE = '2026-07-01T08:00:00.000Z'

function hoursAfter(hours: number): string {
  return new Date(new Date(BASE).getTime() + hours * 3600 * 1000).toISOString()
}

function reading(
  hours: number,
  overrides: Partial<Pick<SensorReading, 'moisture' | 'battery' | 'temperature' | 'light'>>,
): SensorReading {
  return {
    sensorId: 'sensor-1',
    plantId: 'plant-1',
    timestamp: hoursAfter(hours),
    ...overrides,
  }
}

describe('detectShallowWatering', () => {
  it('détecte un arrosage superficiel : la surface monte fort, la profondeur ne suit pas, et l’écart persiste', () => {
    const wateringEvents: WateringEvent[] = [
      { id: 'w1', plantId: 'plant-1', timestamp: hoursAfter(0), kind: 'normal' },
    ]
    const history: SensorReading[] = [
      reading(-1, { moisture: { surface: 30, deep: 28 } }), // avant arrosage
      reading(1, { moisture: { surface: 80, deep: 32 } }), // juste après arrosage
      reading(12, { moisture: { surface: 78, deep: 32 } }),
      reading(24, { moisture: { surface: 75, deep: 31 } }),
    ]

    const result = detectShallowWatering(history, wateringEvents, new Date(hoursAfter(24)))

    expect(result).not.toBeNull()
    expect(result?.type).toBe('shallow_watering')
    expect(result?.triggeringData.gap as number).toBeGreaterThanOrEqual(30)
  })

  it('ne détecte rien sans arrosage récent', () => {
    const history: SensorReading[] = [
      reading(-1, { moisture: { surface: 30, deep: 28 } }),
      reading(24, { moisture: { surface: 75, deep: 31 } }),
    ]
    expect(detectShallowWatering(history, [], new Date(hoursAfter(24)))).toBeNull()
  })
})

describe('detectOverwateringRisk', () => {
  it('détecte une humidité profonde qui reste élevée plusieurs jours de suite', () => {
    const history: SensorReading[] = [
      reading(24, { moisture: { surface: 50, deep: 58 } }),
      reading(48, { moisture: { surface: 48, deep: 60 } }),
      reading(72, { moisture: { surface: 46, deep: 57 } }),
      reading(96, { moisture: { surface: 45, deep: 56 } }),
    ]
    const result = detectOverwateringRisk(history, new Date(hoursAfter(96)))
    expect(result).not.toBeNull()
    expect(result?.type).toBe('overwatering_risk')
  })

  it('ne détecte rien si l’humidité profonde redescend rapidement', () => {
    const history: SensorReading[] = [
      reading(24, { moisture: { surface: 50, deep: 58 } }),
      reading(48, { moisture: { surface: 45, deep: 40 } }),
      reading(72, { moisture: { surface: 40, deep: 25 } }),
    ]
    expect(detectOverwateringRisk(history, new Date(hoursAfter(72)))).toBeNull()
  })
})

describe('detectLowBattery', () => {
  it('signale un niveau critique sous le seuil critique', () => {
    const result = detectLowBattery(10)
    expect(result).not.toBeNull()
    expect(result?.level).toBe('critical')
  })

  it('signale un avertissement entre les deux seuils', () => {
    const result = detectLowBattery(25)
    expect(result).not.toBeNull()
    expect(result?.level).toBe('warning')
  })

  it('ne signale rien au-dessus du seuil d’avertissement', () => {
    expect(detectLowBattery(80)).toBeNull()
  })

  it('ne signale rien si la batterie est inconnue', () => {
    expect(detectLowBattery(undefined)).toBeNull()
  })
})

describe('estimateDaysUntilDry / detectDrySoon', () => {
  it('estime une prévision de sécheresse cohérente à partir d’une tendance décroissante', () => {
    const history: SensorReading[] = [
      reading(0, { moisture: { surface: 70 } }),
      reading(24, { moisture: { surface: 60 } }),
      reading(48, { moisture: { surface: 52 } }),
      reading(72, { moisture: { surface: 45 } }),
      reading(96, { moisture: { surface: 40 } }),
    ]
    const now = new Date(hoursAfter(96))
    const days = estimateDaysUntilDry(history, now, 30)
    expect(days).not.toBeNull()
    expect(days as number).toBeGreaterThan(0)
    expect(days as number).toBeLessThan(10)

    const recommendation = detectDrySoon(history, now)
    expect(recommendation).not.toBeNull()
    expect(recommendation?.type).toBe('dry_soon')
  })

  it('ne prévoit rien quand l’humidité est stable ou remonte', () => {
    const history: SensorReading[] = [
      reading(0, { moisture: { surface: 55 } }),
      reading(24, { moisture: { surface: 57 } }),
      reading(48, { moisture: { surface: 56 } }),
      reading(72, { moisture: { surface: 58 } }),
    ]
    const now = new Date(hoursAfter(72))
    expect(estimateDaysUntilDry(history, now, 30)).toBeNull()
    expect(detectDrySoon(history, now)).toBeNull()
  })
})

describe('absence de faux positif avec une seule sonde (capteur S, surface uniquement)', () => {
  it('ne détecte ni arrosage superficiel ni excès d’eau sans donnée de profondeur', () => {
    const wateringEvents: WateringEvent[] = [
      { id: 'w1', plantId: 'plant-1', timestamp: hoursAfter(0), kind: 'normal' },
    ]
    // Grosse variation de surface, comme un vrai arrosage, mais aucune sonde profonde.
    const history: SensorReading[] = [
      reading(-1, { moisture: { surface: 25 } }),
      reading(1, { moisture: { surface: 85 } }),
      reading(24, { moisture: { surface: 70 } }),
      reading(48, { moisture: { surface: 60 } }),
      reading(72, { moisture: { surface: 55 } }),
    ]
    const now = new Date(hoursAfter(72))
    expect(detectShallowWatering(history, wateringEvents, now)).toBeNull()
    expect(detectOverwateringRisk(history, now)).toBeNull()
  })
})

describe('formulation toujours prudente, jamais catégorique', () => {
  const cautiousWords = Object.values(CAUTIOUS_WORDING)

  it('l’explication de l’arrosage superficiel contient au moins un mot prudent', () => {
    const wateringEvents: WateringEvent[] = [
      { id: 'w1', plantId: 'plant-1', timestamp: hoursAfter(0), kind: 'normal' },
    ]
    const history: SensorReading[] = [
      reading(-1, { moisture: { surface: 30, deep: 28 } }),
      reading(1, { moisture: { surface: 80, deep: 32 } }),
      reading(12, { moisture: { surface: 78, deep: 32 } }),
      reading(24, { moisture: { surface: 75, deep: 31 } }),
    ]
    const result = detectShallowWatering(history, wateringEvents, new Date(hoursAfter(24)))
    expect(result).not.toBeNull()
    expect(cautiousWords.some((word) => result?.explanation.includes(word))).toBe(true)
  })

  it('l’explication de l’excès d’eau contient au moins un mot prudent', () => {
    const history: SensorReading[] = [
      reading(24, { moisture: { surface: 50, deep: 58 } }),
      reading(48, { moisture: { surface: 48, deep: 60 } }),
      reading(72, { moisture: { surface: 46, deep: 57 } }),
      reading(96, { moisture: { surface: 45, deep: 56 } }),
    ]
    const result = detectOverwateringRisk(history, new Date(hoursAfter(96)))
    expect(result).not.toBeNull()
    expect(cautiousWords.some((word) => result?.explanation.includes(word))).toBe(true)
  })
})
