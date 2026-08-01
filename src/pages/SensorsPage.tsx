import { Bluetooth, Radio, Signal, Wifi, WifiOff, X } from 'lucide-react'
import { useState } from 'react'
import { AddPlantWizard } from '../components/forms/AddPlantWizard'
import { MetricMini } from '../components/ui/Metrics'
import { PageHeader } from '../components/ui/Metrics'
import { LoadingState } from '../components/ui/States'
import { useHubStatus } from '../hooks/useHubStatus'
import { usePlants } from '../hooks/usePlants'
import type { Plant } from '../types'
import { formatFullDateTime, formatPercent, formatRelativeTime, formatSignal } from '../utils/format'
import { readJSON, STORAGE_KEYS } from '../utils/storage'
import { DemoDataBanner } from '../components/ui/DemoDataBanner'

const FIRMWARE_VERSION_SIMULEE = '1.2.0-sim'

export function SensorsPage() {
  const { plants, loading, addPlant } = usePlants()
  const { hub } = useHubStatus()
  const [showPairing, setShowPairing] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const lastViewedPlantId = readJSON<string | undefined>(STORAGE_KEYS.selectedSensorId, undefined)

  return (
    <>
      <PageHeader
        title="Capteurs"
        subtitle="État du hub et de chaque capteur PlantMind."
        action={
          <button
            onClick={() => setShowPairing(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238]"
          >
            <Bluetooth size={18} aria-hidden="true" /> Associer un capteur
          </button>
        }
      />

      <div className="mb-5">
        <DemoDataBanner />
      </div>

      <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`grid h-11 w-11 place-items-center rounded-2xl ${hub?.online ? 'bg-[#eef4e8] text-[#426238]' : 'bg-stone-100 text-stone-400'}`}>
              <Radio size={20} aria-hidden="true" />
            </div>
            <div>
              <div className="font-semibold text-stone-900">{hub?.name ?? 'Hub PlantMind'}</div>
              <div className="text-xs text-stone-500">{hub?.online ? 'Connecté' : 'Déconnecté'} · connexion locale, sans cloud</div>
            </div>
          </div>
          {hub?.online ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <Wifi size={13} aria-hidden="true" /> En ligne
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-500">
              <WifiOff size={13} aria-hidden="true" /> Hors ligne
            </span>
          )}
        </div>

        {hub && (
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricMini label="Wi-Fi" icon={<Wifi size={14} aria-hidden="true" />} value={hub.wifiQuality} />
            <MetricMini
              label="Ambiance"
              icon={<Radio size={14} aria-hidden="true" />}
              value={`${hub.ambientTemperature.toFixed(1)} °C`}
            />
            <MetricMini label="Humidité air" icon={<Radio size={14} aria-hidden="true" />} value={`${Math.round(hub.ambientHumidity)} %`} />
            <MetricMini label="Dernière synchro" icon={<Radio size={14} aria-hidden="true" />} value={formatRelativeTime(hub.lastSync)} />
          </div>
        )}
      </div>

      <h2 className="mb-4 mt-8 text-xl font-semibold tracking-tight">Capteurs associés</h2>
      {loading ? (
        <LoadingState label="Chargement des capteurs…" />
      ) : plants.length === 0 ? (
        <p className="text-sm text-stone-500">Aucun capteur associé pour l’instant.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plants.map((plant) => (
            <SensorCard key={plant.id} plant={plant} lastViewed={plant.id === lastViewedPlantId} />
          ))}
        </div>
      )}

      {showPairing && <PairingModal onClose={() => setShowPairing(false)} onUseDemo={() => { setShowPairing(false); setShowWizard(true) }} />}
      {showWizard && (
        <AddPlantWizard
          onClose={() => setShowWizard(false)}
          onSubmit={async (input) => {
            await addPlant(input)
            setShowWizard(false)
          }}
        />
      )}
    </>
  )
}

function SensorCard({ plant, lastViewed }: { plant: Plant; lastViewed: boolean }) {
  const reading = plant.latestReading
  const connected = plant.status !== 'offline'
  return (
    <div
      className={`rounded-[26px] border bg-white p-5 shadow-sm ${lastViewed ? 'border-[#96ab8f] ring-1 ring-[#96ab8f]/40' : 'border-stone-200'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-900">{plant.nickname}</span>
            {lastViewed && (
              <span className="rounded-full bg-[#eef4e8] px-2 py-0.5 text-[10px] font-medium text-[#426238]">
                Dernier consulté
              </span>
            )}
          </div>
          <div className="text-xs text-stone-400">Capteur {plant.sensorSize} · {plant.probeDepths.length} sonde{plant.probeDepths.length > 1 ? 's' : ''}</div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            connected ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
          }`}
        >
          {connected ? <Wifi size={11} aria-hidden="true" /> : <WifiOff size={11} aria-hidden="true" />}
          {connected ? 'Connecté' : 'Hors ligne'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MetricMini label="Batterie" icon={<Signal size={14} aria-hidden="true" />} value={formatPercent(reading?.battery?.level)} />
        <MetricMini label="Signal" icon={<Signal size={14} aria-hidden="true" />} value={formatSignal(reading?.signalStrength)} />
      </div>

      <div className="mt-4 space-y-1.5 text-xs text-stone-500">
        <div className="flex justify-between">
          <span>Firmware (simulé)</span>
          <span className="font-medium text-stone-700">{FIRMWARE_VERSION_SIMULEE}</span>
        </div>
        <div className="flex justify-between">
          <span>Dernière synchro</span>
          <span className="font-medium text-stone-700" title={reading ? formatFullDateTime(reading.timestamp) : undefined}>
            {reading ? formatRelativeTime(reading.timestamp) : '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Sondes</span>
          <span className="font-medium text-stone-700">{plant.probeDepths.join(', ')}</span>
        </div>
        <div className="flex justify-between">
          <span>Mode</span>
          <span className="font-medium text-stone-700">{plant.usesRealSensor ? 'Capteur réel (en attente)' : 'Démonstration'}</span>
        </div>
      </div>
    </div>
  )
}

function PairingModal({ onClose, onUseDemo }: { onClose: () => void; onUseDemo: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef4e8] text-[#426238]">
            <Bluetooth size={22} aria-hidden="true" />
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-9 w-9 place-items-center rounded-full bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <h2 className="mt-4 text-lg font-semibold">Le Bluetooth réel arrive bientôt</h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          Aucun capteur physique n’est encore validé : l’association Bluetooth n’est pas encore fonctionnelle. En
          attendant, tu peux ajouter une plante en mode démonstration pour explorer PlantMind.
        </p>
        <button
          onClick={onUseDemo}
          className="mt-5 w-full rounded-2xl bg-[#426238] py-3 text-sm font-medium text-white hover:bg-[#36532f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238] focus-visible:ring-offset-2"
        >
          Ajouter une plante en mode démonstration
        </button>
      </div>
    </div>
  )
}
