import type { Alert, DataProvider, HistoryRange, Hub, NewPlantInput, Plant, SensorReading } from '../../types'

const NOT_READY_MESSAGE =
  'LocalHubDataProvider n\'est pas encore implémenté : en attente du hub PlantMind physique. ' +
  'Voir docs/hardware-integration.md.'

/**
 * Fournisseur futur : lira les données via le hub PlantMind local
 * (ESP32-C3), en HTTP local et/ou WebSocket local, sans dépendance cloud.
 *
 * Aucun hardware n'existe encore : chaque méthode échoue volontairement
 * plutôt que de renvoyer une fausse donnée. Cette classe existe pour que
 * l'abstraction `DataProvider` soit prête le jour où le hub sera prêt —
 * remplacer `MockDataProvider` par celle-ci ne devra toucher aucun
 * composant d'interface.
 */
export class LocalHubDataProvider implements DataProvider {
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
