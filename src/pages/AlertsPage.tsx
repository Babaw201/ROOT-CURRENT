import { BellOff } from 'lucide-react'
import { useMemo } from 'react'
import { AlertCard } from '../components/ui/AlertCard'
import { PageHeader } from '../components/ui/Metrics'
import { EmptyState, LoadingState } from '../components/ui/States'
import { useAlerts } from '../hooks/useAlerts'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { usePlants } from '../hooks/usePlants'
import { DEFAULT_PREFERENCES, STORAGE_KEYS } from '../utils/storage'

export function AlertsPage({ onOpenPlant }: { onOpenPlant: (id: string) => void }) {
  const { alerts, loading, markAsRead, unreadCount } = useAlerts()
  const { plants } = usePlants()
  const [preferences, setPreferences] = useLocalStorageState(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES)
  const filter = preferences.alertsFilter

  const visibleAlerts = useMemo(
    () => (filter === 'unread' ? alerts.filter((a) => !a.read) : alerts),
    [alerts, filter],
  )
  const plantName = (plantId: string) => plants.find((p) => p.id === plantId)?.nickname ?? 'Plante'

  return (
    <>
      <PageHeader
        title="Alertes"
        subtitle={unreadCount > 0 ? `${unreadCount} alerte${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}.` : 'Tout est lu, bien joué.'}
        action={
          <div className="inline-flex rounded-2xl bg-stone-100 p-1" role="group" aria-label="Filtrer les alertes">
            <button
              onClick={() => setPreferences((prev) => ({ ...prev, alertsFilter: 'unread' }))}
              aria-pressed={filter === 'unread'}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238] ${filter === 'unread' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
            >
              Non lues
            </button>
            <button
              onClick={() => setPreferences((prev) => ({ ...prev, alertsFilter: 'all' }))}
              aria-pressed={filter === 'all'}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238] ${filter === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
            >
              Toutes
            </button>
          </div>
        }
      />

      {loading ? (
        <LoadingState label="Chargement des alertes…" />
      ) : visibleAlerts.length === 0 ? (
        <EmptyState
          icon={<BellOff size={24} aria-hidden="true" />}
          title={filter === 'unread' ? 'Aucune alerte non lue' : 'Aucune alerte'}
          description="PlantMind ne crée une alerte que lorsqu'une action a vraiment du sens — pas pour chaque petite variation."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              plantName={plantName(alert.plantId)}
              onMarkAsRead={markAsRead}
              onOpenPlant={() => onOpenPlant(alert.plantId)}
            />
          ))}
        </div>
      )}
    </>
  )
}
