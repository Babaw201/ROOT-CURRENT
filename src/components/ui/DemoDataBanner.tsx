import { FlaskConical } from 'lucide-react'
import type { Plant } from '../../types'

/**
 * Rappel visible que les mesures affichées sont simulées. Toujours présent
 * tant qu'aucun hardware réel n'est validé (voir cahier des charges §4).
 * Formulation différente selon que l'utilisateur a choisi le mode démo ou
 * « capteur réel » (auquel cas on attend encore l'appairage).
 */
export function DemoDataBanner({ plant }: { plant?: Plant }) {
  const awaitingRealSensor = plant?.usesRealSensor === true
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-500">
      <FlaskConical size={15} className="mt-0.5 shrink-0 text-stone-400" aria-hidden="true" />
      {awaitingRealSensor
        ? 'Capteur réel non encore appairé : ces valeurs sont simulées en attendant la connexion Bluetooth.'
        : 'Mode démonstration : ces valeurs sont simulées, aucun capteur physique n\u2019est encore connecté.'}
    </div>
  )
}
