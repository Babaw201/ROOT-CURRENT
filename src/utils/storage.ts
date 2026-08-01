/**
 * Wrapper autour de localStorage avec un numéro de schéma, pour pouvoir
 * migrer les données plus tard sans casser les installations existantes.
 * Toutes les opérations sont protégées : le stockage local peut être
 * indisponible (navigation privée, quota dépassé, etc.).
 */

export const STORAGE_SCHEMA_VERSION = 1

const NAMESPACE = 'plantmind'

export const STORAGE_KEYS = {
  schemaVersion: `${NAMESPACE}:schema_version`,
  plants: `${NAMESPACE}:plants`,
  readAlertIds: `${NAMESPACE}:read_alert_ids`,
  alertFirstSeen: `${NAMESPACE}:alert_first_seen`,
  preferences: `${NAMESPACE}:preferences`,
  selectedSensorId: `${NAMESPACE}:selected_sensor_id`,
  chartFilters: `${NAMESPACE}:chart_filters`,
} as const

/** Préférences d'interface persistées (extensible : un seul objet, pas une clé par réglage). */
export interface PlantMindPreferences {
  alertsFilter: 'unread' | 'all'
}

export const DEFAULT_PREFERENCES: PlantMindPreferences = {
  alertsFilter: 'unread',
}

function isStorageAvailable(): boolean {
  try {
    const testKey = `${NAMESPACE}:__test__`
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  if (!isStorageAvailable()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON<T>(key: string, value: T): boolean {
  if (!isStorageAvailable()) return false
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key: string): void {
  if (!isStorageAvailable()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // silencieux : rien de critique ne dépend de la suppression
  }
}

/**
 * À appeler une fois au démarrage. Pour l'instant il n'existe qu'une seule
 * version de schéma ; cette fonction est le point d'ancrage pour de futures
 * migrations (ex. renommage de champ, changement de format d'historique).
 */
export function runStorageMigrationsIfNeeded(): void {
  const currentVersion = readJSON<number>(STORAGE_KEYS.schemaVersion, 0)
  if (currentVersion >= STORAGE_SCHEMA_VERSION) return
  // Aucune migration nécessaire pour l'instant : on initialise simplement la version.
  writeJSON(STORAGE_KEYS.schemaVersion, STORAGE_SCHEMA_VERSION)
}

export function resetAllPlantMindStorage(): void {
  Object.values(STORAGE_KEYS).forEach(removeKey)
}
