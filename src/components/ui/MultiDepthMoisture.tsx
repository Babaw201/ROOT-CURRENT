import { AlertTriangle } from 'lucide-react'
import type { MoistureReading } from '../../types'

const DEPTH_ROWS: { key: keyof MoistureReading; label: string; color: string }[] = [
  { key: 'surface', label: 'Surface', color: '#52764a' },
  { key: 'middle', label: 'Milieu', color: '#b98a3d' },
  { key: 'deep', label: 'Zone racinaire', color: '#b76553' },
]

/**
 * Visualise l'humidité aux profondeurs réellement mesurées. N'affiche
 * jamais une profondeur absente : une plante à une seule sonde n'affiche
 * qu'une seule barre, sans valeur inventée pour les autres zones.
 */
export function MultiDepthMoisture({ moisture }: { moisture: MoistureReading | undefined }) {
  if (!moisture) return null
  const rows = DEPTH_ROWS.filter((row) => moisture[row.key] !== undefined)
  if (rows.length === 0) return null

  const gap =
    moisture.surface !== undefined && moisture.deep !== undefined ? moisture.surface - moisture.deep : undefined
  const significantGap = gap !== undefined && gap >= 30

  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">Humidité par profondeur</h2>
      <p className="mt-1 text-xs text-stone-400">
        {rows.length < 3
          ? 'Ce capteur ne couvre pas toutes les profondeurs : seules les zones mesurées sont affichées.'
          : 'Les trois zones du pot, de la surface jusqu’aux racines.'}
      </p>

      <div className="mt-5 space-y-4">
        {rows.map((row) => {
          const value = moisture[row.key] as number
          return (
            <div key={row.key}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-stone-700">{row.label}</span>
                <span className="font-semibold text-stone-900">{Math.round(value)} %</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(2, value))}%`, backgroundColor: row.color }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {significantGap && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          Écart important entre la surface et la profondeur : l’eau n’a peut-être pas atteint la zone racinaire.
        </div>
      )}
    </div>
  )
}
