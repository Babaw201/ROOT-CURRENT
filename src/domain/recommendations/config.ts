/**
 * Configuration centralisée de toutes les règles de détection.
 *
 * Aucun seuil « magique » ne doit être écrit ailleurs dans le code
 * (composants ou moteur). Si un réglage doit changer, il change ici.
 *
 * Ces valeurs sont des points de départ raisonnables, pas des vérités
 * scientifiques : elles sont volontairement regroupées pour être faciles
 * à ajuster au fur et à mesure des retours terrain.
 */
export const RECOMMENDATION_CONFIG = {
  shallowWatering: {
    /** Fenêtre de recherche d'un arrosage récent. */
    lookbackHours: 72,
    /** Hausse minimale en surface pour considérer qu'un arrosage a eu lieu. */
    minSurfaceJumpPoints: 25,
    /** Hausse maximale en profondeur malgré la hausse en surface. */
    maxDeepJumpPoints: 8,
    /** Écart minimal surface/profondeur pour parler d'arrosage superficiel. */
    minSurfaceDeepGapPoints: 30,
    /** Durée minimale pendant laquelle l'écart doit persister. */
    minPersistenceHours: 10,
  },
  overwateringRisk: {
    /** Humidité profonde à partir de laquelle on surveille un excès. */
    deepMoistureHighThreshold: 55,
    /** Nombre de jours consécutifs à ce niveau avant d'alerter. */
    minPersistenceDays: 3,
  },
  drySoon: {
    /** Humidité de surface sous laquelle un arrosage devient probable. */
    lowMoistureThreshold: 30,
    /** Nombre minimal de points nécessaires pour juger une tendance. */
    minTrendPoints: 3,
    /** Nombre de jours de prévision maximum communiqué (au-delà : trop incertain). */
    maxForecastDays: 10,
  },
  lowBattery: {
    warningLevel: 30,
    criticalLevel: 15,
  },
  lowLight: {
    dliWarningThreshold: 4,
    minConsecutiveDays: 3,
  },
  temperature: {
    lowThreshold: 12,
    highThreshold: 30,
  },
  unusualDrying: {
    /** Ratio pente récente / pente de référence au-delà duquel on parle d'anomalie. */
    fasterRatio: 1.3,
    slowerRatio: 0.82,
    /** Nombre de jours de chaque fenêtre (récente / référence) comparée. */
    windowDays: 7,
  },
  unusualDrainage: {
    /** Chute de surface (en points) dans les heures suivant un arrosage, sans réponse en profondeur. */
    minSurfaceDropPoints: 20,
    withinHoursOfWatering: 6,
  },
  sensorOffline: {
    offlineAfterHours: 6,
  },
} as const

/**
 * Vocabulaire prudent imposé pour toute formulation générée automatiquement.
 * PlantMind ne présente jamais une estimation comme une certitude.
 */
export const CAUTIOUS_WORDING = {
  possible: 'possible',
  seems: 'semble',
  probably: 'probablement',
  toVerify: 'à vérifier',
} as const
