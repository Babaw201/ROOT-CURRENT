import { ChevronRight, Sprout } from 'lucide-react'
import type { Plant } from '../../types'
import { formatPercent, formatRelativeTime } from '../../utils/format'
import { MiniStat } from './Metrics'
import { StatusBadge } from './StatusBadge'

export function PlantCard({ plant, onOpen }: { plant: Plant; onOpen: () => void }) {
  const surface = plant.latestReading?.moisture?.surface
  const light = plant.latestReading?.light?.dli
  const battery = plant.latestReading?.battery?.level
  const syncedAt = plant.latestReading?.timestamp ?? plant.createdAt

  return (
    <button
      onClick={onOpen}
      className="group w-full rounded-[28px] border border-stone-200/80 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238] focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#eef4e8] text-[#426238]">
            <Sprout size={26} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-stone-900">{plant.nickname}</h3>
              <StatusBadge status={plant.status} />
            </div>
            <p className="mt-0.5 truncate text-sm text-stone-500">{plant.species ?? 'Espèce non précisée'}</p>
            <p className="mt-2 text-xs text-stone-400">
              {plant.room} · Capteur {plant.sensorSize}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-stone-100 pt-4">
        <MiniStat label="Sol" value={formatPercent(surface)} />
        <MiniStat label="Lumière" value={light !== undefined ? `${light.toFixed(1)} DLI` : '—'} />
        <MiniStat label="Batterie" value={formatPercent(battery)} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-stone-700">{plant.recommendation.action}</div>
          <div className="text-xs text-stone-400">Synchro {formatRelativeTime(syncedAt)}</div>
        </div>
        <ChevronRight
          className="shrink-0 text-stone-400 transition group-hover:translate-x-0.5"
          size={18}
          aria-hidden="true"
        />
      </div>
    </button>
  )
}
