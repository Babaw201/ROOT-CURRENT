import { useCallback, useEffect, useState } from 'react'
import type { Alert } from '../types'
import { useDataProvider } from './useDataProvider'

interface UseAlertsResult {
  alerts: Alert[]
  loading: boolean
  unreadCount: number
  markAsRead: (alertId: string) => Promise<void>
  refresh: () => void
}

export function useAlerts(): UseAlertsResult {
  const provider = useDataProvider()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    provider.getAlerts().then((result) => {
      setAlerts(result)
      setLoading(false)
    })
  }, [provider])

  useEffect(() => {
    refresh()
    return provider.subscribeToUpdates(refresh)
  }, [provider, refresh])

  const markAsRead = useCallback(
    async (alertId: string) => {
      await provider.markAlertAsRead(alertId)
    },
    [provider],
  )

  return { alerts, loading, unreadCount: alerts.filter((a) => !a.read).length, markAsRead, refresh }
}
