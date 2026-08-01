import { AlertTriangle, Gauge, Plus, Sprout, Wifi } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AddPlantWizard } from '../components/forms/AddPlantWizard'
import { DemoDataBanner } from '../components/ui/DemoDataBanner'
import { EmptyState, LoadingState } from '../components/ui/States'
import { MetricCard, PageHeader } from '../components/ui/Metrics'
import { PlantCard } from '../components/ui/PlantCard'
import { useAlerts } from '../hooks/useAlerts'
import { useHubStatus } from '../hooks/useHubStatus'
import { usePlants } from '../hooks/usePlants'
import type { Plant } from '../types'
import { formatRelativeTime } from '../utils/format'

/** Plantes dont la recommandation actuelle est une observation plutôt qu'une action : alimente « Ce que PlantMind apprend ». */
function pickLearningInsight(plants: Plant[]): Plant | undefined {
  return plants.find(
    (p) => p.status === 'good' && p.recommendation.explanation && p.recommendation.action === "Rien à faire aujourd'hui" && p.history.length > 5 && p.recommendation.explanation.includes('%'),
  )
}

export function HomePage({ onOpenPlant, onSeeAllPlants }: { onOpenPlant: (id: string) => void; onSeeAllPlants: () => void }) {
  const { plants, loading, addPlant } = usePlants()
  const { alerts } = useAlerts()
  const { hub } = useHubStatus()
  const [showWizard, setShowWizard] = useState(false)

  const attentionCount = plants.filter((p) => p.status === 'action' || p.status === 'offline').length
  const importantAlerts = useMemo(() => alerts.filter((a) => a.level !== 'info' && !a.read).slice(0, 3), [alerts])
  const insightPlant = useMemo(() => pickLearningInsight(plants), [plants])

  return (
    <>
      <PageHeader
        title="Tes plantes, sans deviner."
        subtitle="PlantMind transforme les vraies mesures de chaque pot en actions simples à faire."
        action={
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#426238] px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#36532f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238] focus-visible:ring-offset-2"
          >
            <Plus size={18} aria-hidden="true" /> Ajouter une plante
          </button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Sprout size={18} aria-hidden="true" />} label="Plantes suivies" value={`${plants.length}`} hint={plants.length === 0 ? 'Ajoute ta première plante' : 'Toutes synchronisées'} />
        <MetricCard
          icon={<AlertTriangle size={18} aria-hidden="true" />}
          label="À surveiller"
          value={`${attentionCount}`}
          hint="Action recommandée aujourd’hui"
        />
        <MetricCard
          icon={<Wifi size={18} aria-hidden="true" />}
          label="Hub central"
          value={hub?.online ? 'En ligne' : 'Hors ligne'}
          hint={hub ? `Dernière synchro ${formatRelativeTime(hub.lastSync)}` : '—'}
        />
        <MetricCard
          icon={<Gauge size={18} aria-hidden="true" />}
          label="Ambiance"
          value={hub ? `${hub.ambientTemperature.toFixed(1)} °C` : '—'}
          hint={hub ? `${Math.round(hub.ambientHumidity)} % d’humidité relative` : '—'}
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_.8fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Mes plantes</h2>
            <button
              onClick={onSeeAllPlants}
              className="rounded-lg text-sm font-medium text-[#4b6845] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238]"
            >
              Tout voir
            </button>
          </div>
          {loading ? (
            <LoadingState label="Chargement des plantes…" />
          ) : plants.length === 0 ? (
            <EmptyState
              icon={<Sprout size={26} aria-hidden="true" />}
              title="Aucune plante pour l’instant"
              description="Ajoute ta première plante pour que PlantMind commence à apprendre son rythme de séchage."
              action={
                <button
                  onClick={() => setShowWizard(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#426238] px-4 py-2.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238] focus-visible:ring-offset-2"
                >
                  <Plus size={16} aria-hidden="true" /> Ajouter une plante
                </button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {plants.slice(0, 4).map((plant) => (
                <PlantCard key={plant.id} plant={plant} onOpen={() => onOpenPlant(plant.id)} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Alertes importantes</h2>
            {importantAlerts.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">Aucune alerte importante non lue pour le moment.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {importantAlerts.map((alert) => {
                  const plant = plants.find((p) => p.id === alert.plantId)
                  return (
                    <button
                      key={alert.id}
                      onClick={() => onOpenPlant(alert.plantId)}
                      className="block w-full rounded-2xl bg-stone-50 p-3 text-left text-sm transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238]"
                    >
                      <div className="font-medium text-stone-800">{alert.title}</div>
                      <div className="mt-0.5 text-xs text-stone-500">{plant?.nickname ?? 'Plante'}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {insightPlant && (
            <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Ce que PlantMind apprend</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">{insightPlant.recommendation.explanation}</p>
            </div>
          )}

          <DemoDataBanner />
        </div>
      </section>

      {showWizard && (
        <AddPlantWizard
          onClose={() => setShowWizard(false)}
          onSubmit={async (input) => {
            const plant = await addPlant(input)
            setShowWizard(false)
            onOpenPlant(plant.id)
          }}
        />
      )}
    </>
  )
}
