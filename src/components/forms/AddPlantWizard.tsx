import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { NewPlantInput, PotSize, ProbeDepth, SensorSize, WindowPosition } from '../../types'

const TOTAL_STEPS = 9

const POT_SIZES: PotSize[] = ['Petit', 'Moyen', 'Grand']
const SENSOR_SIZES: { value: SensorSize; label: string; maxDepths: number }[] = [
  { value: 'S', label: 'S · Petit pot', maxDepths: 1 },
  { value: 'M', label: 'M · Pot moyen', maxDepths: 2 },
  { value: 'L', label: 'L · Grand pot', maxDepths: 3 },
]
const WINDOW_POSITIONS: { value: WindowPosition; label: string }[] = [
  { value: 'contre_la_fenetre', label: 'Contre la fenêtre' },
  { value: 'proche', label: 'Proche d’une fenêtre' },
  { value: 'eloignee', label: 'Éloignée d’une fenêtre' },
  { value: 'aucune_fenetre', label: 'Pas de fenêtre dans la pièce' },
]

function depthsForCount(count: number): ProbeDepth[] {
  if (count >= 3) return ['surface', 'middle', 'deep']
  if (count === 2) return ['surface', 'deep']
  return ['surface']
}

interface WizardState {
  nickname: string
  species: string
  room: string
  potSize?: PotSize
  sensorSize?: SensorSize
  depthCount: number
  windowPosition?: WindowPosition
  usesRealSensor: boolean
}

const INITIAL_STATE: WizardState = {
  nickname: '',
  species: '',
  room: '',
  potSize: undefined,
  sensorSize: undefined,
  depthCount: 1,
  windowPosition: undefined,
  usesRealSensor: false,
}

export function AddPlantWizard({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (input: NewPlantInput) => void
}) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<WizardState>(INITIAL_STATE)

  const canAdvance: Record<number, boolean> = {
    1: form.nickname.trim().length > 0,
    2: true,
    3: form.room.trim().length > 0,
    4: form.potSize !== undefined,
    5: form.sensorSize !== undefined,
    6: form.depthCount >= 1,
    7: form.windowPosition !== undefined,
    8: true,
    9: true,
  }

  function selectSensorSize(sensorSize: SensorSize, maxDepths: number) {
    setForm((prev) => ({ ...prev, sensorSize, depthCount: Math.min(prev.depthCount, maxDepths) || maxDepths }))
  }

  function handleSubmit() {
    if (!form.potSize || !form.sensorSize || !form.windowPosition) return
    onSubmit({
      nickname: form.nickname.trim(),
      species: form.species.trim() || undefined,
      room: form.room.trim(),
      potSize: form.potSize,
      sensorSize: form.sensorSize,
      probeDepths: depthsForCount(form.depthCount),
      windowPosition: form.windowPosition,
      usesRealSensor: form.usesRealSensor,
    })
  }

  const selectedSensor = SENSOR_SIZES.find((s) => s.value === form.sensorSize)

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/30 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-[32px] bg-white p-5 shadow-2xl sm:rounded-[32px] sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[.16em] text-[#5b7653]">
              Étape {step}/{TOTAL_STEPS}
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Ajouter une plante</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-[#426238] transition-all"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <div className="mt-6 min-h-[220px]">
          {step === 1 && (
            <label className="block text-sm font-medium text-stone-700">
              Nom ou surnom de la plante
              <input
                autoFocus
                value={form.nickname}
                onChange={(e) => setForm((prev) => ({ ...prev, nickname: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-[#64825d]"
                placeholder="Ex. Monstera du salon"
              />
            </label>
          )}

          {step === 2 && (
            <label className="block text-sm font-medium text-stone-700">
              Espèce <span className="font-normal text-stone-400">(facultatif)</span>
              <input
                value={form.species}
                onChange={(e) => setForm((prev) => ({ ...prev, species: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-[#64825d]"
                placeholder="Ex. Monstera deliciosa"
              />
            </label>
          )}

          {step === 3 && (
            <label className="block text-sm font-medium text-stone-700">
              Pièce
              <input
                value={form.room}
                onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))}
                className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-[#64825d]"
                placeholder="Ex. Salon"
              />
            </label>
          )}

          {step === 4 && (
            <div>
              <div className="text-sm font-medium text-stone-700">Taille du pot</div>
              <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Taille du pot">
                {POT_SIZES.map((size) => (
                  <ChoiceButton
                    key={size}
                    label={size}
                    selected={form.potSize === size}
                    onClick={() => setForm((prev) => ({ ...prev, potSize: size }))}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <div className="text-sm font-medium text-stone-700">Type de capteur</div>
              <p className="mt-1 text-xs text-stone-400">Détermine combien de profondeurs peuvent être mesurées.</p>
              <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Type de capteur">
                {SENSOR_SIZES.map((sensor) => (
                  <ChoiceButton
                    key={sensor.value}
                    label={sensor.label}
                    selected={form.sensorSize === sensor.value}
                    onClick={() => selectSensorSize(sensor.value, sensor.maxDepths)}
                    align="left"
                  />
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <div className="text-sm font-medium text-stone-700">Profondeurs disponibles sur ce capteur</div>
              <p className="mt-1 text-xs text-stone-400">
                Ne choisis que les sondes réellement présentes : PlantMind n’invente jamais une mesure absente.
              </p>
              <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Nombre de profondeurs">
                {Array.from({ length: selectedSensor?.maxDepths ?? 1 }, (_, i) => i + 1).map((count) => (
                  <ChoiceButton
                    key={count}
                    label={depthsForCount(count).map(depthLabel).join(' + ')}
                    selected={form.depthCount === count}
                    onClick={() => setForm((prev) => ({ ...prev, depthCount: count }))}
                    align="left"
                  />
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <div className="text-sm font-medium text-stone-700">Position par rapport à une fenêtre</div>
              <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Position par rapport à la fenêtre">
                {WINDOW_POSITIONS.map((pos) => (
                  <ChoiceButton
                    key={pos.value}
                    label={pos.label}
                    selected={form.windowPosition === pos.value}
                    onClick={() => setForm((prev) => ({ ...prev, windowPosition: pos.value }))}
                    align="left"
                  />
                ))}
              </div>
            </div>
          )}

          {step === 8 && (
            <div>
              <div className="text-sm font-medium text-stone-700">Source des données</div>
              <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Mode démonstration ou capteur réel">
                <ChoiceButton
                  label="Mode démonstration"
                  description="Des données simulées illustrent le fonctionnement de PlantMind."
                  selected={!form.usesRealSensor}
                  onClick={() => setForm((prev) => ({ ...prev, usesRealSensor: false }))}
                  align="left"
                />
                <ChoiceButton
                  label="Capteur réel (à appairer)"
                  description="Aucun hardware n’est encore validé : des données simulées s’affichent en attendant."
                  selected={form.usesRealSensor}
                  onClick={() => setForm((prev) => ({ ...prev, usesRealSensor: true }))}
                  align="left"
                />
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="rounded-3xl bg-[#f3f6ef] p-6">
              <div className="font-semibold text-stone-900">{form.nickname}</div>
              <dl className="mt-3 space-y-1.5 text-sm text-stone-600">
                {form.species && (
                  <div className="flex justify-between">
                    <dt>Espèce</dt>
                    <dd>{form.species}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>Pièce</dt>
                  <dd>{form.room}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Pot</dt>
                  <dd>
                    {form.potSize} · Capteur {form.sensorSize}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Profondeurs</dt>
                  <dd>{depthsForCount(form.depthCount).map(depthLabel).join(' + ')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Source</dt>
                  <dd>{form.usesRealSensor ? 'Capteur réel (à appairer)' : 'Mode démonstration'}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-5 text-stone-500">
                PlantMind commence maintenant à apprendre le rythme de séchage de ce pot.
              </p>
            </div>
          )}
        </div>

        <div className="mt-7 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-2xl border border-stone-200 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238]"
            >
              Retour
            </button>
          )}
          <button
            disabled={!canAdvance[step]}
            onClick={() => (step < TOTAL_STEPS ? setStep((s) => s + 1) : handleSubmit())}
            className="flex-1 rounded-2xl bg-[#426238] py-3 text-sm font-medium text-white transition hover:bg-[#36532f] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238] focus-visible:ring-offset-2"
          >
            {step < TOTAL_STEPS ? 'Continuer' : 'Ajouter la plante'}
          </button>
        </div>
      </div>
    </div>
  )
}

function depthLabel(depth: ProbeDepth): string {
  if (depth === 'surface') return 'Surface'
  if (depth === 'middle') return 'Milieu'
  return 'Zone racinaire'
}

function ChoiceButton({
  label,
  description,
  selected,
  onClick,
  align = 'center',
}: {
  label: string
  description?: string
  selected: boolean
  onClick: () => void
  align?: 'center' | 'left'
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`rounded-2xl border p-4 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238] ${
        align === 'left' ? 'flex items-start justify-between gap-3 text-left' : 'text-center'
      } ${selected ? 'border-[#64825d] bg-[#f1f6ed]' : 'border-stone-200 hover:border-[#64825d] hover:bg-[#f1f6ed]'}`}
    >
      <span>
        <span className="block font-medium text-stone-800">{label}</span>
        {description && <span className="mt-1 block text-xs font-normal text-stone-500">{description}</span>}
      </span>
      {selected && <Check size={16} className="mt-0.5 shrink-0 text-[#426238]" aria-hidden="true" />}
    </button>
  )
}
