import type { Alert, DataProvider, HistoryRange, Hub, NewPlantInput, Plant, SensorReading } from '../../types'

const NOT_READY_MESSAGE =
  'HomeAssistantDataProvider n\'est pas encore implémenté : l\'intégration Home Assistant complète ' +
  'n\'est pas encore développée. Voir docs/hardware-integration.md.'

/**
 * Fournisseur futur : lira les entités déjà exposées dans Home Assistant
 * (capteurs découverts via MQTT/BTHome, ou proxy Bluetooth HA), en HTTP
 * local et/ou WebSocket local vers l'instance HA de l'utilisateur.
 *
 * Réservé aux utilisateurs qui ont déjà Home Assistant : PlantMind ne
 * l'exige jamais. Chaque méthode échoue volontairement pour l'instant.
 */
export class HomeAssistantDataProvider implements DataProvider {
  getPlants(): Promise<Plant[]> {
    return Promise.reject(new Error(NOT_READY_MESSAGE))
  }
  getPlant(_id: string): Promise<Plant | undefined> {
    return Promise.reject(new Error(NOT_READY_MESSAGE))
  }
  getReadings(_plantId: string, _range: HistoryRange): Promise<SensorReading[]> {
    return Promise.reject(new Error(NOT_READY_MESSAGE))
  }
  getAlerts(): Promise<Alert[]> {
    return Promise.reject(new Error(NOT_READY_MESSAGE))
  }
  getHubStatus(): Promise<Hub | null> {
    return Promise.reject(new Error(NOT_READY_MESSAGE))
  }
  subscribeToUpdates(_callback: () => void): () => void {
    return () => {}
  }
  addPlant(_input: NewPlantInput): Promise<Plant> {
    return Promise.reject(new Error(NOT_READY_MESSAGE))
  }
  markAlertAsRead(_alertId: string): Promise<void> {
    return Promise.reject(new Error(NOT_READY_MESSAGE))
  }
}
