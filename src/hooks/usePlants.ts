import { useCallback, useEffect, useState } from 'react'
import type { NewPlantInput, Plant } from '../types'
import { useDataProvider } from './useDataProvider'

interface UsePlantsResult {
  plants: Plant[]
  loading: boolean
  error: string | null
  addPlant: (input: NewPlantInput) => Promise<Plant>
  refresh: () => void
}

export function usePlants(): UsePlantsResult {
  const provider = useDataProvider()
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    provider
      .getPlants()
      .then((result) => {
        setPlants(result)
        setError(null)
      })
      .catch(() => setError('Impossible de charger les plantes pour le moment.'))
      .finally(() => setLoading(false))
  }, [provider])

  useEffect(() => {
    refresh()
    return provider.subscribeToUpdates(refresh)
  }, [provider, refresh])

  const addPlant = useCallback((input: NewPlantInput) => provider.addPlant(input), [provider])

  return { plants, loading, error, addPlant, refresh }
}
