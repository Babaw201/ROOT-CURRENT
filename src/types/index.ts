/**
 * Modèles de données partagés par toute l'application.
 *
 * Toutes les dates sont des chaînes ISO 8601 (`new Date().toISOString()`),
 * ce qui permet de sérialiser facilement en localStorage et de comparer
 * les timestamps sans ambiguïté de fuseau horaire.
 */

export type SensorSize = 'S' | 'M' | 'L'

export type PotSize = 'Petit' | 'Moyen' | 'Grand'

/** Les trois zones de mesure possibles dans un pot. */
export type ProbeDepth = 'surface' | 'middle' | 'deep'

/**
 * État global d'une plante, tel qu'affiché sur les cartes et badges.
 * Volontairement limité à 4 valeurs concrètes : jamais un score abstrait.
 */
export type PlantStatus = 'good' | 'watch' | 'action' | 'offline'

/** Niveau de gravité d'une alerte. */
export type AlertLevel = 'info' | 'warning' | 'critical'

/**
 * Les 10 types d'alertes que PlantMind sait détecter.
 * Toute nouvelle règle de détection doit passer par un de ces types,
 * pour éviter la prolifération d'alertes ad hoc.
 */
export type AlertType =
  | 'shallow_watering'
  | 'overwatering_risk'
  | 'dry_soon'
  | 'low_light'
  | 'high_temperature'
  | 'low_temperature'
  | 'low_battery'
  | 'sensor_offline'
  | 'unusual_drying'
  | 'unusual_drainage'

/** Formulation prudente : PlantMind ne prétend jamais être catégorique. */
export type ConfidenceLevel = 'faible' | 'moyenne' | 'élevée'

export interface Probe {
  depth: ProbeDepth
  sensorId: string
}

/** Une sonde d'humidité peut ne pas couvrir toutes les profondeurs. */
export interface MoistureReading {
  surface?: number
  middle?: number
  deep?: number
}

export interface LightReading {
  /** Daily Light Integral estimé, en mol/m²/jour. */
  dli: number
  /** Photosynthetic Photon Flux Density instantané estimé, en µmol/m²/s. */
  ppfd?: number
}

export interface BatteryReading {
  /** Pourcentage 0-100. */
  level: number
}

/**
 * Une mesure envoyée par un capteur à un instant donné.
 * Les capteurs n'échantillonnent pas tous à fréquence fixe ni à la même
 * fréquence entre eux : tous les champs sont facultatifs sauf l'horodatage.
 */
export interface SensorReading {
  sensorId: string
  plantId: string
  /** ISO 8601. */
  timestamp: string
  moisture?: MoistureReading
  light?: LightReading
  /** °C */
  temperature?: number
  /** Humidité de l'air ambiant, en %. */
  ambientHumidity?: number
  battery?: BatteryReading
  /** Puissance de signal BLE approximative, en dBm. */
  signalStrength?: number
}

export interface Sensor {
  id: string
  plantId: string
  size: SensorSize
  /** Nombre de profondeurs réellement câblées sur ce capteur (1 à 3). */
  probeDepths: ProbeDepth[]
  battery: number
  signalStrength?: number
  /** Version de firmware simulée : aucun vrai firmware n'existe encore. */
  firmwareVersionSimulated: string
  connected: boolean
  lastSeen: string
}

export type HubWifiQuality = 'excellent' | 'bon' | 'faible' | 'hors_ligne'

export interface Hub {
  id: string
  name: string
  online: boolean
  wifiQuality: HubWifiQuality
  ambientTemperature: number
  ambientHumidity: number
  connectedSensorIds: string[]
  lastSync: string
}

export type WateringEventKind = 'normal' | 'shallow_suspected'

export interface WateringEvent {
  id: string
  plantId: string
  timestamp: string
  kind: WateringEventKind
  note?: string
}

export interface Recommendation {
  action: string
  explanation: string
  confidence: ConfidenceLevel
  status: PlantStatus
  generatedAt: string
}

export interface Alert {
  id: string
  plantId: string
  type: AlertType
  level: AlertLevel
  title: string
  explanation: string
  /** ISO 8601. */
  date: string
  read: boolean
  recommendedAction: string
  /** Valeurs numériques ou textuelles qui ont déclenché l'alerte, pour la transparence. */
  triggeringData: Record<string, number | string>
}

/** D'où vient la position de la plante par rapport à une source de lumière. */
export type WindowPosition = 'contre_la_fenetre' | 'proche' | 'eloignee' | 'aucune_fenetre'

export interface Plant {
  id: string
  nickname: string
  species?: string
  room: string
  potSize: PotSize
  sensorSize: SensorSize
  /** Profondeurs disponibles pour cette plante précise (peut être un sous-ensemble du capteur). */
  probeDepths: ProbeDepth[]
  windowPosition: WindowPosition
  status: PlantStatus
  latestReading?: SensorReading
  recommendation: Recommendation
  history: SensorReading[]
  wateringEvents: WateringEvent[]
  createdAt: string
  /**
   * true si l'utilisateur a choisi « capteur réel » lors de l'ajout.
   * IMPORTANT : tant qu'aucun hardware n'est validé, ces plantes affichent
   * quand même des données simulées, mais avec un bandeau explicite.
   * Ne jamais utiliser ce champ pour présenter une donnée comme réelle.
   */
  usesRealSensor: boolean
}

export type HistoryRange = '24h' | '7j' | '30j'

/**
 * Couche d'abstraction pour la source des données.
 * Les composants d'interface ne doivent jamais dépendre d'un fournisseur
 * concret : ils passent toujours par cette interface.
 */
export interface DataProvider {
  getPlants(): Promise<Plant[]>
  getPlant(id: string): Promise<Plant | undefined>
  getReadings(plantId: string, range: HistoryRange): Promise<SensorReading[]>
  getAlerts(): Promise<Alert[]>
  getHubStatus(): Promise<Hub | null>
  /** Retourne une fonction de désabonnement. */
  subscribeToUpdates(callback: () => void): () => void
  /**
   * Opérations d'écriture nécessaires au parcours « Ajout d'une plante » et
   * à la gestion des alertes. Absentes de l'exemple minimal du cahier des
   * charges mais indispensables : un DataProvider réel (hub local, HA...)
   * devra aussi les implémenter, même si pour l'instant seul MockDataProvider
   * le fait vraiment.
   */
  addPlant(input: NewPlantInput): Promise<Plant>
  markAlertAsRead(alertId: string): Promise<void>
}

export type NewPlantInput = {
  nickname: string
  species?: string
  room: string
  potSize: PotSize
  sensorSize: SensorSize
  probeDepths: ProbeDepth[]
  windowPosition: WindowPosition
  usesRealSensor: boolean
}
