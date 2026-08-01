import { useEffect, useState } from 'react'
import type { Hub } from '../types'
import { useDataProvider } from './useDataProvider'

interface UseHubStatusResult {
  hub: Hub | null
  loading: boolean
}

export function useHubStatus(): UseHubStatusResult {
  const provider = useDataProvider()
  const [hub, setHub] = useState<Hub | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = () => {
      provider.getHubStatus().then((result) => {
        if (active) {
          setHub(result)
          setLoading(false)
        }
      })
    }
    load()
    const unsubscribe = provider.subscribeToUpdates(load)
    return () => {
      active = false
      unsubscribe()
    }
  }, [provider])

  return { hub, loading }
}
