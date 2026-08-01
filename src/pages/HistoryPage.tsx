import { useEffect, useState } from 'react'
import { MoistureChart } from '../components/ui/MoistureChart'
import { DemoDataBanner } from '../components/ui/DemoDataBanner'
import { PageHeader } from '../components/ui/Metrics'
import { RangeToggle } from '../components/ui/RangeAndWatering'
import { EmptyState, LoadingState } from '../components/ui/States'
import { usePlants } from '../hooks/usePlants'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import type { HistoryRange } from '../types'
import { formatFullDateTime } from '../utils/format'
import { STORAGE_KEYS } from '../utils/storage'
import { filterReadingsByRange } from '../utils/time'
import { History } from 'lucide-react'

export function HistoryPage() {
  const { plants, loading } = usePlants()
  const [filters, setFilters] = useLocalStorageState(STORAGE_KEYS.chartFilters, { range: '7j' as HistoryRange })
  const [selectedPlantId, setSelectedPlantId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!selectedPlantId && plants.length > 0) setSelectedPlantId(plants[0].id)
  }, [plants, selectedPlantId])

  const selectedPlant = plants.find((p) => p.id === selectedPlantId)

  const wateringLog = plants
    .flatMap((plant) => plant.wateringEvents.map((event) => ({ event, plantName: plant.nickname })))
    .sort((a, b) => new Date(b.event.timestamp).getTime() - new Date(a.event.timestamp).getTime())
    .slice(0, 20)

  return (
    <>
      <PageHeader title="Historique" subtitle="Retrace l’évolution de chaque pot et les arrosages récents, toutes plantes confondues." />

      <div className="mb-5">
        <DemoDataBanner />
      </div>

      {loading ? (
        <LoadingState label="Chargement de l’historique…" />
      ) : plants.length === 0 ? (
        <EmptyState
          icon={<History size={24} aria-hidden="true" />}
          title="Rien à afficher pour l’instant"
          description="Ajoute une plante pour commencer à accumuler de l’historique."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.4fr_.7fr]">
          <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <label className="text-sm">
                <span className="mr-2 font-semibold text-stone-800">Plante</span>
                <select
                  value={selectedPlantId}
                  onChange={(e) => setSelectedPlantId(e.target.value)}
                  className="rounded-xl border border-stone-200 px-3 py-1.5 text-sm outline-none focus:border-[#64825d]"
                >
                  {plants.map((plant) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.nickname}
                    </option>
                  ))}
                </select>
              </label>
              <RangeToggle value={filters.range} onChange={(range) => setFilters({ range })} />
            </div>
            {selectedPlant && <MoistureChart readings={filterReadingsByRange(selectedPlant.history, filters.range)} range={filters.range} />}
          </div>

          <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Journal d’arrosage</h2>
            <p className="mt-1 text-xs text-stone-400">Les 20 arrosages les plus récents, toutes plantes confondues.</p>
            {wateringLog.length === 0 ? (
              <p className="mt-4 text-sm text-stone-500">Aucun arrosage enregistré pour l’instant.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {wateringLog.map(({ event, plantName }) => (
                  <div key={event.id} className="flex items-start gap-3 text-sm text-stone-600">
                    <div
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${event.kind === 'shallow_suspected' ? 'bg-amber-500' : 'bg-[#52764a]'}`}
                      aria-hidden="true"
                    />
                    <div>
                      <span className="font-medium text-stone-800">{plantName}</span> ·{' '}
                      {event.kind === 'shallow_suspected' ? 'arrosage superficiel suspecté' : 'arrosage'}
                      <div className="text-xs text-stone-400">{formatFullDateTime(event.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
