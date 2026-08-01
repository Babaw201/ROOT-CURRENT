import { generateAlertsForPlant } from '../domain/recommendations'
import { getSeedHub, getSeedPlants, type PlantSeed } from '../mocks/scenarios'
import type { Alert, AlertLevel, DataProvider, HistoryRange, Hub, NewPlantInput, Plant, SensorReading } from '../types'
import { filterReadingsByRange } from '../utils/time'
import { readJSON, STORAGE_KEYS, writeJSON } from '../utils/storage'
import { hydratePlant } from './hydratePlant'

type Listener = () => void

const LEVEL_RANK: Record<AlertLevel, number> = { critical: 0, warning: 1, info: 2 }

function generatePlantId(): string {
  return `plant-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Fournisseur de données simulées : c'est la seule implémentation réelle de
 * `DataProvider` pour l'instant. Toutes les données viennent de
 * `src/mocks/scenarios.ts` et du localStorage — jamais d'un vrai capteur.
 *
 * Combine les 8 scénarios de démonstration avec les plantes réellement
 * ajoutées par l'utilisateur (persistées en localStorage), et calcule
 * statuts / recommandations / alertes à la volée via le moteur de règles.
 */
export class MockDataProvider implements DataProvider {
  private listeners = new Set<Listener>()
  private addedSeeds: PlantSeed[]
  private readAlertIds: Set<string>
  private alertFirstSeen: Record<string, string>
  private now: () => Date

  constructor(now: () => Date = () => new Date()) {
    this.now = now
    this.addedSeeds = readJSON<PlantSeed[]>(STORAGE_KEYS.plants, [])
    this.readAlertIds = new Set(readJSON<string[]>(STORAGE_KEYS.readAlertIds, []))
    this.alertFirstSeen = readJSON<Record<string, string>>(STORAGE_KEYS.alertFirstSeen, {})
  }

  private plants(): Plant[] {
    const now = this.now()
    return [...getSeedPlants(now), ...this.addedSeeds].map((seed) => hydratePlant(seed, now))
  }

  private notify(): void {
    this.listeners.forEach((callback) => callback())
  }

  async getPlants(): Promise<Plant[]> {
    return this.plants()
  }

  async getPlant(id: string): Promise<Plant | undefined> {
    return this.plants().find((plant) => plant.id === id)
  }

  async getReadings(plantId: string, range: HistoryRange): Promise<SensorReading[]> {
    const plant = await this.getPlant(plantId)
    if (!plant) return []
    return filterReadingsByRange(plant.history, range, this.now())
  }

  async getAlerts(): Promise<Alert[]> {
    const now = this.now()
    const generated = this.plants().flatMap((plant) => generateAlertsForPlant(plant, now))

    let firstSeenChanged = false
    const withStableDates = generated.map((alert) => {
      if (!this.alertFirstSeen[alert.id]) {
        this.alertFirstSeen[alert.id] = alert.date
        firstSeenChanged = true
      }
      return {
        ...alert,
        date: this.alertFirstSeen[alert.id],
        read: this.readAlertIds.has(alert.id),
      }
    })
    if (firstSeenChanged) writeJSON(STORAGE_KEYS.alertFirstSeen, this.alertFirstSeen)

    return withStableDates.sort(
      (a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  }

  async getHubStatus(): Promise<Hub | null> {
    return getSeedHub(this.now())
  }

  subscribeToUpdates(callback: Listener): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  async addPlant(input: NewPlantInput): Promise<Plant> {
    const now = this.now()
    const id = generatePlantId()

    // Une plante qui vient d'être ajoutée n'a qu'un seul point de mesure de
    // référence : on ne fabrique jamais un faux historique passé.
    const initialReading: SensorReading = {
      sensorId: `sensor-${id}`,
      plantId: id,
      timestamp: now.toISOString(),
      moisture: {
        surface: 50,
        middle: input.probeDepths.includes('middle') ? 50 : undefined,
        deep: input.probeDepths.includes('deep') ? 50 : undefined,
      },
      light: { dli: 5 },
      temperature: 21,
      ambientHumidity: 50,
      battery: { level: 100 },
      signalStrength: -50,
    }

    const seed: PlantSeed = {
      id,
      nickname: input.nickname,
      species: input.species,
      room: input.room,
      potSize: input.potSize,
      sensorSize: input.sensorSize,
      probeDepths: input.probeDepths,
      windowPosition: input.windowPosition,
      history: [initialReading],
      wateringEvents: [],
      createdAt: now.toISOString(),
      usesRealSensor: input.usesRealSensor,
    }

    this.addedSeeds = [...this.addedSeeds, seed]
    writeJSON(STORAGE_KEYS.plants, this.addedSeeds)
    this.notify()
    return hydratePlant(seed, now)
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    this.readAlertIds.add(alertId)
    writeJSON(STORAGE_KEYS.readAlertIds, Array.from(this.readAlertIds))
    this.notify()
  }
}

let sharedInstance: MockDataProvider | null = null

/** Instance partagée par toute l'application (voir `src/data/context.tsx`). */
export function getMockDataProvider(): MockDataProvider {
  if (!sharedInstance) sharedInstance = new MockDataProvider()
  return sharedInstance
}
