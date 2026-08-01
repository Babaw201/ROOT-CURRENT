import { useCallback, useEffect, useState } from 'react'
import type { Plant } from '../types'
import { useDataProvider } from './useDataProvider'

interface UsePlantResult {
  plant: Plant | undefined
  loading: boolean
  refresh: () => void
}

export function usePlant(id: string | undefined): UsePlantResult {
  const provider = useDataProvider()
  const [plant, setPlant] = useState<Plant | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    if (!id) {
      setPlant(undefined)
      setLoading(false)
      return
    }
    provider.getPlant(id).then((result) => {
      setPlant(result)
      setLoading(false)
    })
  }, [provider, id])

  useEffect(() => {
    refresh()
    return provider.subscribeToUpdates(refresh)
  }, [provider, refresh])

  return { plant, loading, refresh }
}
