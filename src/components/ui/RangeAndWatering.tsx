import type { HistoryRange, WateringEvent } from '../../types'
import { formatFullDateTime } from '../../utils/format'

const RANGE_OPTIONS: HistoryRange[] = ['24h', '7j', '30j']

export function RangeToggle({ value, onChange }: { value: HistoryRange; onChange: (range: HistoryRange) => void }) {
  return (
    <div className="inline-flex rounded-2xl bg-stone-100 p-1" role="group" aria-label="Choisir la période affichée">
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`rounded-xl px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238] ${
            value === option ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

export function WateringTimeline({ events }: { events: WateringEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-stone-400">Aucun arrosage enregistré pour l’instant.</p>
  }
  const sorted = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return (
    <div className="space-y-3">
      {sorted.map((event) => (
        <div key={event.id} className="flex items-start gap-3 text-sm text-stone-600">
          <div
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
              event.kind === 'shallow_suspected' ? 'bg-amber-500' : 'bg-[#52764a]'
            }`}
            aria-hidden="true"
          />
          <div>
            <div>
              {event.kind === 'shallow_suspected' ? 'Arrosage superficiel suspecté' : 'Arrosage'} ·{' '}
              {formatFullDateTime(event.timestamp)}
            </div>
            {event.note && <div className="text-xs text-stone-400">{event.note}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
