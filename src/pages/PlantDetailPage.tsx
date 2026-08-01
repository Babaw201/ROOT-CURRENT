import { useEffect } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  BatteryMedium,
  Bluetooth,
  CheckCircle2,
  Droplets,
  Eye,
  Sun,
  Thermometer,
  WifiOff,
} from 'lucide-react'
import { BatteryChart } from '../components/ui/BatteryChart'
import { DemoDataBanner } from '../components/ui/DemoDataBanner'
import { LightChart } from '../components/ui/LightChart'
import { MetricCard } from '../components/ui/Metrics'
import { MoistureChart } from '../components/ui/MoistureChart'
import { MultiDepthMoisture } from '../components/ui/MultiDepthMoisture'
import { RangeToggle, WateringTimeline } from '../components/ui/RangeAndWatering'
import { LoadingState } from '../components/ui/States'
import { StatusBadge } from '../components/ui/StatusBadge'
import { usePlant } from '../hooks/usePlant'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import type { HistoryRange, PlantStatus } from '../types'
import { formatFullDateTime, formatPercent, formatRelativeTime, formatTemperature } from '../utils/format'
import { STORAGE_KEYS, writeJSON } from '../utils/storage'
import { filterReadingsByRange } from '../utils/time'
import { STATUS_STYLES } from '../components/ui/status'

const STATUS_BANNER_ICON: Record<PlantStatus, typeof CheckCircle2> = {
  good: CheckCircle2,
  watch: Eye,
  action: AlertTriangle,
  offline: WifiOff,
}

export function PlantDetailPage({ plantId, onBack }: { plantId: string; onBack: () => void }) {
  const { plant, loading } = usePlant(plantId)
  const [filters, setFilters] = useLocalStorageState(STORAGE_KEYS.chartFilters, { range: '7j' as HistoryRange })

  // Le capteur d'un pot étant unique dans ce MVP, « capteur consulté » et
  // « plante consultée » sont la même chose : on retient la dernière visite,
  // pour que l'écran Capteurs puisse la mettre en évidence.
  useEffect(() => {
    writeJSON(STORAGE_KEYS.selectedSensorId, plantId)
  }, [plantId])

  if (loading) return <LoadingState label="Chargement de la plante…" />
  if (!plant) {
    return (
      <div>
        <BackButton onBack={onBack} />
        <p className="text-sm text-stone-500">Cette plante n’existe plus.</p>
      </div>
    )
  }

  const reading = plant.latestReading
  const moisture = reading?.moisture
  const BannerIcon = STATUS_BANNER_ICON[plant.status]
  const rangedReadings = filterReadingsByRange(plant.history, filters.range)

  return (
    <section>
      <BackButton onBack={onBack} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-[#eaf1e4] text-[#426238]">
            <Droplets size={30} aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">{plant.nickname}</h1>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs text-stone-500 ring-1 ring-stone-200">
                Capteur {plant.sensorSize}
              </span>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              {plant.species ?? 'Espèce non précisée'} · {plant.room}
            </p>
          </div>
        </div>
        <StatusBadge status={plant.status} size="md" />
      </div>

      <div className={`mb-6 rounded-[30px] border p-5 ${STATUS_STYLES[plant.status]}`}>
        <div className="flex items-start gap-4">
          <div className="mt-0.5">
            <BannerIcon size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-lg font-semibold">{plant.recommendation.action}</div>
              <span className="text-xs opacity-70">Confiance {plant.recommendation.confidence}</span>
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-6 opacity-80">{plant.recommendation.explanation}</p>
            <p className="mt-2 text-xs opacity-60">
              Dernière synchronisation {reading ? formatRelativeTime(reading.timestamp) : 'inconnue'}
            </p>

            <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm">
              <div className="font-medium">Pourquoi PlantMind pense ça</div>
              <p className="mt-2 leading-6 text-stone-700">{plant.recommendation.explanation}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Droplets size={18} aria-hidden="true" />}
          label="Humidité de surface"
          value={formatPercent(moisture?.surface)}
          hint={moisture?.deep !== undefined ? `${formatPercent(moisture.deep)} en profondeur` : 'Pas de sonde de profondeur'}
        />
        <MetricCard
          icon={<Sun size={18} aria-hidden="true" />}
          label="Lumière aujourd’hui"
          value={reading?.light ? `${reading.light.dli.toFixed(1)} DLI` : '—'}
          hint={reading?.light?.ppfd ? `PPFD estimé ${reading.light.ppfd} µmol/m²/s` : 'Estimation indisponible'}
        />
        <MetricCard
          icon={<Thermometer size={18} aria-hidden="true" />}
          label="Micro-climat"
          value={formatTemperature(reading?.temperature)}
          hint={reading?.ambientHumidity !== undefined ? `${Math.round(reading.ambientHumidity)}% humidité relative` : '—'}
        />
        <MetricCard
          icon={<BatteryMedium size={18} aria-hidden="true" />}
          label="Capteur"
          value={formatPercent(reading?.battery?.level)}
          hint={reading ? `Synchro ${formatRelativeTime(reading.timestamp)}` : '—'}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_.7fr]">
        <div className="space-y-5">
          <MultiDepthMoisture moisture={moisture} />

          <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Humidité</h2>
                <p className="mt-1 text-xs text-stone-400">La tendance compte plus que la valeur instantanée.</p>
              </div>
              <RangeToggle value={filters.range} onChange={(range) => setFilters({ range })} />
            </div>
            <MoistureChart readings={rangedReadings} range={filters.range} />
          </div>

          <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Exposition lumineuse journalière</h2>
            <div className="mt-4">
              <LightChart readings={rangedReadings} />
            </div>
          </div>

          <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Historique de batterie</h2>
            <div className="mt-4">
              <BatteryChart readings={rangedReadings} range={filters.range} />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Arrosages récents</h2>
            <div className="mt-4">
              <WateringTimeline events={plant.wateringEvents} />
            </div>
          </div>

          <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Capteur PlantMind</h2>
            <div className="mt-4 space-y-3 text-sm">
              <Row label="Bluetooth" value={plant.usesRealSensor ? 'En attente d’appairage' : 'Simulé'} />
              <Row label="Taille" value={plant.sensorSize} />
              <Row label="Pot" value={plant.potSize} />
              <Row label="Profondeurs" value={plant.probeDepths.length.toString()} />
              <Row label="Dernière synchro" value={reading ? formatFullDateTime(reading.timestamp) : '—'} />
            </div>
          </div>

          <DemoDataBanner plant={plant} />
        </div>
      </div>
    </section>
  )
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238] rounded-lg"
    >
      <ArrowLeft size={17} aria-hidden="true" /> Retour
    </button>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-800">{value}</span>
    </div>
  )
}
