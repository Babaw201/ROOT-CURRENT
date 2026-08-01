import type { Alert, DataProvider, HistoryRange, Hub, NewPlantInput, Plant, SensorReading } from '../../types'

const NOT_READY_MESSAGE =
  'BluetoothDataProvider n\'est pas encore implémenté : le Bluetooth réel n\'est pas encore connecté. ' +
  'Voir docs/hardware-integration.md.'

/**
 * Fournisseur futur : lira directement les capteurs en Bluetooth Low Energy
 * (probablement via le format BTHome et l'API Web Bluetooth), sans passer
 * par le hub. Utile pour un usage sans hub, à portée directe du téléphone.
 *
 * Aucun capteur BLE réel n'est encore connecté : chaque méthode échoue
 * volontairement plutôt que d'inventer une donnée.
 */
export class BluetoothDataProvider implements DataProvider {
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
