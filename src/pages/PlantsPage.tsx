import { Plus, Sprout } from 'lucide-react'
import { useState } from 'react'
import { AddPlantWizard } from '../components/forms/AddPlantWizard'
import { DemoDataBanner } from '../components/ui/DemoDataBanner'
import { EmptyState, LoadingState } from '../components/ui/States'
import { PageHeader } from '../components/ui/Metrics'
import { PlantCard } from '../components/ui/PlantCard'
import { usePlants } from '../hooks/usePlants'

export function PlantsPage({ onOpenPlant }: { onOpenPlant: (id: string) => void }) {
  const { plants, loading, addPlant } = usePlants()
  const [showWizard, setShowWizard] = useState(false)

  return (
    <>
      <PageHeader
        title="Mes plantes"
        subtitle={`${plants.length} plante${plants.length > 1 ? 's' : ''} suivie${plants.length > 1 ? 's' : ''}.`}
        action={
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#426238] px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#36532f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238] focus-visible:ring-offset-2"
          >
            <Plus size={18} aria-hidden="true" /> Ajouter une plante
          </button>
        }
      />

      <div className="mb-5">
        <DemoDataBanner />
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} onOpen={() => onOpenPlant(plant.id)} />
          ))}
        </div>
      )}

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
