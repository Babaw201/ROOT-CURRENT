import { computeRecommendation } from '../domain/recommendations'
import type { Plant } from '../types'
import type { PlantSeed } from '../mocks/scenarios'

/**
 * Transforme une plante « brute » (mesures uniquement) en `Plant` complète,
 * en calculant son statut et sa recommandation via le moteur de règles.
 * Point de passage unique : que la plante vienne des scénarios simulés ou
 * d'un ajout utilisateur, elle est toujours hydratée de la même façon.
 */
export function hydratePlant(seed: PlantSeed, now: Date = new Date()): Plant {
  const latestReading = seed.history[seed.history.length - 1]
  const withoutRecommendation: Plant = {
    ...seed,
    latestReading,
    status: 'good',
    recommendation: {
      action: '',
      explanation: '',
      confidence: 'faible',
      status: 'good',
      generatedAt: now.toISOString(),
    },
  }
  const recommendation = computeRecommendation(withoutRecommendation, now)
  return { ...withoutRecommendation, status: recommendation.status, recommendation }
}
